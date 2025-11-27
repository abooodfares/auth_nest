import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { UserLoginDto, UserRegisterDto, ResetPasswordDto, LogoutDto, RefreshTokenRequestDto, ForgotPasswordRequestDto, ForgotPasswordResetDto, VerifyOtpRegisterDto, VerifyOtpLoginDto } from './dto/auth_dto';
import { PasswordService } from './services/password/password.service';
import { AUTH_ERROR_MESSAGES } from './constants/errorMessages';
import { AUTH_SUCCESS_MESSAGES } from './constants/successMessages';
import { AUTH_NUMERIC_CONSTANTS } from './constants/numericConstants';
import { AUTH_ACTION_TYPES } from './constants/actionTypes';
import { UsersQuery } from '../common/USERS_DB/usersQuary';
import { GenerateTokensService } from './services/jwt/services/genrateTokens';
import { HandleDeviceService } from './services/device/handleDeviceCreation';
import { TokensQuariesService } from './services/jwt/quaries/tokensQuaries';
import { SendMessagesService } from './services/otps/sendotps';
import { VerifyOtpService } from './services/otps/verify_otp';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private usersQuery: UsersQuery,
        private generateTokensService: GenerateTokensService,
        private passwordService: PasswordService,
        private handleDeviceService: HandleDeviceService,
        private tokensQuariesService: TokensQuariesService,
        private sendMessagesService: SendMessagesService,
        private verifyOtpService: VerifyOtpService
    ) { }

    async register(createUserDto: UserRegisterDto) {
        try {
            const { email, fingerprint } = createUserDto;
            
            // Check if user already exists
            const existingUser = await this.usersQuery.findUserByEmail(email);
            if (existingUser) {
                throw new ConflictException('User already exists');
            }
            
            // Send OTP
            await this.sendMessagesService.sendOtpEmail({
                email,
                action: AUTH_ACTION_TYPES.REGISTER,
                deviceFingerprint: fingerprint,
            });
            
            return { message: AUTH_SUCCESS_MESSAGES.REGISTER_OTP_SENT };
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new ConflictException(AUTH_ERROR_MESSAGES.Rigster_Later);
        }
    }

    async verifyOtpRegister(verifyOtpRegisterDto: VerifyOtpRegisterDto) {
        try {
            const { email, otpCode, fingerprint, deviceName, password, name, birthOfDate, phone } = verifyOtpRegisterDto;
            
            // Verify OTP
            await this.verifyOtpService.verifyOtp({
                email,
                otpCode,
                deviceFingerprint: fingerprint,
            });
            
            // Check if user already exists
            const existingUser = await this.usersQuery.findUserByEmail(email);
            if (existingUser) {
                throw new ConflictException('User already exists');
            }
            
            // Hash password
            const hashedPassword = await this.passwordService.hashPassword(password);
            
            // Create user
            const user = await this.usersQuery.createUser({
                email,
                password: hashedPassword,
                name,
                birthOfDate,
                phone,
                publicId: randomUUID(),
            });
            
            // Handle device
            await this.handleDeviceService.handleDeviceForRegister(
                user.internal_id,
                fingerprint,
                deviceName
            );
            
            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;
            
            return {
                message: AUTH_SUCCESS_MESSAGES.REGISTER_SUCCESS,
                user: userWithoutPassword,
            };
        } catch (error) {
            if (error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }
            throw new ConflictException(AUTH_ERROR_MESSAGES.Rigster_Later);
        }
    }

    async login(userLoginDto: UserLoginDto) {
        try {
            const { email, fingerprint } = userLoginDto;
            
            // Check if user exists
            const user = await this.usersQuery.findUserByEmail(email);
            if (!user) {
                throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
            }
            
            // Send OTP
            await this.sendMessagesService.sendOtpEmail({
                email,
                action: AUTH_ACTION_TYPES.LOGIN,
                deviceFingerprint: fingerprint,
            });
            
            return { message: AUTH_SUCCESS_MESSAGES.LOGIN_OTP_SENT };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
    }

    async verifyOtpLogin(verifyOtpLoginDto: VerifyOtpLoginDto) {
        try {
            const { email, otpCode, password, fingerprint, deviceName } = verifyOtpLoginDto;
            
            // Verify OTP
            await this.verifyOtpService.verifyOtp({
                email,
                otpCode,
                deviceFingerprint: fingerprint,
            });
            
            // Find user
            const user = await this.usersQuery.findUserByEmail(email);
            if (!user) {
                throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
            }
            
            // Verify password
            const isPasswordValid = await this.passwordService.comparePassword(password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
            }
            
            // Handle device
            await this.handleDeviceService.handleDeviceForLogin(
                user.internal_id,
                fingerprint,
                deviceName
            );
            
            // Generate tokens
            const tokens = await this.generateTokensService.generateTokensforlogin(user.public_id, fingerprint);
            
            return {
                message: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS,
                ...tokens,
            };
        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
                throw error;
            }
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
            const lastAudit = await this.usersQuery.getLastAuditByUserId(user.internal_id);
            const newChangeCount = (lastAudit?.change_count || 0) + 1;

            // Prepare audit data
            const auditData: Prisma.users_auditCreateInput = {
                email: user.email,
                phone: user.phone,
                password: hashedNewPassword,
                is_absher: false,
                birth_of_date: new Date(user.birth_of_date),
                email_verified: user.email_verified,
                phone_verified: user.phone_verified,
                name: user.name,
                change_at: new Date(),
                action_type: AUTH_ACTION_TYPES.PASSWORD_RESET,
                change_count: newChangeCount,
                period_end: new Date(Date.now() + AUTH_NUMERIC_CONSTANTS.SUBSCRIPTION_PERIOD_MS).toISOString(),
                users: {
                    connect: { internal_id: user.internal_id },
                },
                User_device: {
                    connect: { fingerprint: deviceFingerprint },
                },
            };

            // Execute transaction to update password and create audit record
            await this.usersQuery.updatePasswordWithAudit(user.internal_id, hashedNewPassword, auditData);

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
                useruuid: verifiedToken.users.public_id,
                deviceFingerprint: refreshTokenRequestDto.deviceFingerprint,
            });

            return {
                access_token: accessToken,
            };
        } catch (error) {
            
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
        }
    }

    async forgetPassword(forgotPasswordRequestDto: ForgotPasswordRequestDto) {
        const { email, phone, deviceFingerprint } = forgotPasswordRequestDto;

        if (!email && !phone) {
            throw new BadRequestException('Email or phone is required');
        }

        try {
            // Check if user exists
            const user = email 
                ? await this.usersQuery.findUserByEmail(email)
                : phone 
                ? await this.usersQuery.findUserByPhone(phone)
                : null;

            if (!user) {
                throw new BadRequestException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
            }

            // Send OTP
            if (email) {
                await this.sendMessagesService.sendOtpEmail({
                    email,
                    action: AUTH_ACTION_TYPES.FORGOT_PASSWORD,
                    deviceFingerprint,
                });
            } else if (phone) {
                await this.sendMessagesService.sendOtpPhone({
                    phone,
                    action: AUTH_ACTION_TYPES.FORGOT_PASSWORD,
                    deviceFingerprint,
                });
            }

            return { message: AUTH_SUCCESS_MESSAGES.FORGOT_PASSWORD_OTP_SENT };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(AUTH_ERROR_MESSAGES.FORGOT_PASSWORD_FAILED);
        }
    }

    async verifyOtpForgetPassword(forgotPasswordResetDto: ForgotPasswordResetDto) {
        const { email, phone, otpCode, newPassword, deviceFingerprint } = forgotPasswordResetDto;

        if (!email && !phone) {
            throw new BadRequestException('Email or phone is required');
        }

        try {
            // Verify OTP
            await this.verifyOtpService.verifyOtp({
                email,
                phone,
                otpCode,
                deviceFingerprint,
            });

            // Find user
            const user = email 
                ? await this.usersQuery.findUserByEmail(email)
                : phone 
                ? await this.usersQuery.findUserByPhone(phone)
                : null;

            if (!user) {
                throw new BadRequestException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
            }

            // Get last audit to check period_end and change_count
            const lastAudit = await this.usersQuery.getLastAuditByUserId(user.internal_id);
            
            if (lastAudit) {
                const periodEnd = new Date(lastAudit.period_end);
                const now = new Date();
                const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
                const timeUntilPeriodEnd = periodEnd.getTime() - now.getTime();

                // Check if period_end is less than 2 days away
                if (timeUntilPeriodEnd > 0 && timeUntilPeriodEnd < twoDaysInMs) {
                    throw new BadRequestException(AUTH_ERROR_MESSAGES.CHANGE_LIMIT_REACHED);
                }
            }

            // Hash new password
            const hashedNewPassword = await this.passwordService.hashPassword(newPassword);

            // Calculate new change count
            const newChangeCount = (lastAudit?.change_count || 0) + 1;

            // Prepare audit data
            const auditData: Prisma.users_auditCreateInput = {
                email: user.email,
                phone: user.phone,
                password: hashedNewPassword,
                is_absher: false,
                birth_of_date: new Date(user.birth_of_date),
                email_verified: user.email_verified,
                phone_verified: user.phone_verified,
                name: user.name,
                change_at: new Date(),
                action_type: AUTH_ACTION_TYPES.FORGOT_PASSWORD,
                change_count: newChangeCount,
                period_end: new Date(Date.now() + AUTH_NUMERIC_CONSTANTS.SUBSCRIPTION_PERIOD_MS).toISOString(),
                users: {
                    connect: { internal_id: user.internal_id },
                },
                User_device: {
                    connect: { fingerprint: deviceFingerprint },
                },
            };

            // Update password with audit
            await this.usersQuery.updatePasswordWithAudit(user.internal_id, hashedNewPassword, auditData);

            return { message: AUTH_SUCCESS_MESSAGES.FORGOT_PASSWORD_RESET };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
                throw error;
            }
            throw new BadRequestException(AUTH_ERROR_MESSAGES.FORGOT_PASSWORD_FAILED);
        }
    }
}
