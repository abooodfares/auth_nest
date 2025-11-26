import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { UserLoginDto, UserRegisterDto, ResetPasswordDto, LogoutDto, RefreshTokenRequestDto } from './dto/auth_dto';
import { PasswordService } from './services/password/password.service';
import { AUTH_ERROR_MESSAGES } from './constants/errorMessages';
import { AUTH_SUCCESS_MESSAGES } from './constants/successMessages';
import { AUTH_NUMERIC_CONSTANTS } from './constants/numericConstants';
import { AUTH_ACTION_TYPES } from './constants/actionTypes';
import { UsersQuery } from '../common/USERS_DB/usersQuary';
import { GenerateTokensService } from './services/jwt/services/genrateTokens';
import { HandleDeviceService } from './services/device/handleDeviceCreation';
import { TokensQuariesService } from './services/jwt/quaries/tokensQuaries';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private usersQuery: UsersQuery,
        private generateTokensService: GenerateTokensService,
        private passwordService: PasswordService,
        private handleDeviceService: HandleDeviceService,
        private tokensQuariesService: TokensQuariesService
    ) { }

    async register(createUserDto: UserRegisterDto) {
      try {
          const { fingerprint, deviceName, ...userData } = createUserDto;
          
          // Hash password
          const hashedPassword = await this.passwordService.hashPassword(userData.password);
          
          // Create user
          const user = await this.usersQuery.createUser({
              ...userData,
              password: hashedPassword,
          });
          
          // Handle device
          await this.handleDeviceService.handleDeviceForRegister(
              user.internalId,
              fingerprint,
              deviceName
          );
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          
          return userWithoutPassword;
      } catch (error) {
            throw new ConflictException(AUTH_ERROR_MESSAGES.Rigster_Later);
      }
    }


    async login(UserLoginDto: UserLoginDto) {
        try {
            const { fingerprint, deviceName, ...loginData } = UserLoginDto;
            
            const hashedPassword = await this.passwordService.hashPassword(loginData.password);
            const user = await this.usersQuery.findUserByEmailAndPassword({
                ...loginData,
                password: hashedPassword,
            });
            
            if (!user) {
                throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
            }
            
            // Handle device
            await this.handleDeviceService.handleDeviceForLogin(
                user.internalId,
                fingerprint,
                deviceName
            );
            
            return await this.generateTokensService.generateTokensforlogin(user.publicId, fingerprint);
        } catch (error) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
    }
    async resetPassword( resetPasswordDto: ResetPasswordDto) {
        const { oldPassword, newPassword, deviceFingerprint, useruuid } = resetPasswordDto;

        if (!useruuid || !deviceFingerprint) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
        }

        try {
            // Get user with current password
            const user = await this.usersQuery.findUserByPublicId(useruuid);

            if (!user) {
                throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
            }

            // Compare old password with stored password
            const isPasswordValid = await this.passwordService.comparePassword(oldPassword, user.password);

            if (!isPasswordValid) {
                throw new BadRequestException(AUTH_ERROR_MESSAGES.INCORRECT_OLD_PASSWORD);
            }

            // Hash new password
            const hashedNewPassword = await this.passwordService.hashPassword(newPassword);

            // Get current audit count for this user
            const lastAudit = await this.usersQuery.getLastAuditByUserId(user.internalId);
            const newChangeCount = (lastAudit?.changeCount || 0) + 1;

            // Prepare audit data
            const auditData: Prisma.UsersAuditCreateInput = {
                email: user.email,
                phone: user.phone,
                password: hashedNewPassword,
                isAbsher: false,
                birthOfDate: new Date(user.birthOfDate),
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified,
                name: user.name,
                changeAt: new Date(),
                actionType: AUTH_ACTION_TYPES.PASSWORD_RESET,
                changeCount: newChangeCount,
                periodEnd: new Date(Date.now() + AUTH_NUMERIC_CONSTANTS.SUBSCRIPTION_PERIOD_MS).toISOString(),
                user: {
                    connect: { internalId: user.internalId },
                },
                device: {
                    connect: { fingerprint: deviceFingerprint },
                },
            };

            // Execute transaction to update password and create audit record
            await this.usersQuery.updatePasswordWithAudit(user.internalId, hashedNewPassword, auditData);

            return { message: AUTH_SUCCESS_MESSAGES.PASSWORD_RESET };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
                throw error;
            }
            throw new BadRequestException(AUTH_ERROR_MESSAGES.PASSWORD_RESET_FAILED);
        }
    }

    async logout(logoutDto: LogoutDto) {
        if (!logoutDto.useruuid || !logoutDto.deviceFingerprint) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
        }

        try {
            // Revoke the refresh token
            await this.tokensQuariesService.revokeRefreshToken(logoutDto);

            return { message: AUTH_SUCCESS_MESSAGES.LOGOUT };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new BadRequestException(AUTH_ERROR_MESSAGES.LOGOUT_FAILED);
        }
    }

    async refreshToken(refreshTokenRequestDto: RefreshTokenRequestDto) {
        try {
            // Verify the refresh token
            const verifiedToken = await this.tokensQuariesService.verifyRefreshToken(
               refreshTokenRequestDto
            );

            // Generate new access token
            const accessToken = await this.generateTokensService.generateAccessToken({
                useruuid: verifiedToken.user.publicId,
                deviceFingerprint: refreshTokenRequestDto.deviceFingerprint,
            });

            return {
                access_token: accessToken,
            };
        } catch (error) {
            
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
        }
    }
}
