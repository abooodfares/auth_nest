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
import { ResetPasswordHelper } from './services/reset_password/helper';
import { ForgotPasswordSendOtpService } from './services/forgot_password/send_otp';
import { ForgotPasswordVerifyAndResetService } from './services/forgot_password/verify_and_reset';
import { VerifyOtpRegisterService } from './services/register/verify_otp_register';
import { VerifyOtpLoginService } from './services/login/verify_otp_login';

@Injectable()
export class AuthService {
    constructor(
        private usersQuery: UsersQuery,
        private generateTokensService: GenerateTokensService,
        private passwordService: PasswordService,
        private handleDeviceService: HandleDeviceService,
        private tokensQuariesService: TokensQuariesService,
        private sendMessagesService: SendMessagesService,
        private verifyOtpService: VerifyOtpService,
        private resetPasswordHelper: ResetPasswordHelper,
        private forgotPasswordSendOtpService: ForgotPasswordSendOtpService,
        private forgotPasswordVerifyAndResetService: ForgotPasswordVerifyAndResetService,
        private verifyOtpRegisterService: VerifyOtpRegisterService,
        private verifyOtpLoginService: VerifyOtpLoginService
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
        return this.verifyOtpRegisterService.verifyOtpAndRegister(verifyOtpRegisterDto);
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
        return this.verifyOtpLoginService.verifyOtpAndLogin(verifyOtpLoginDto);
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        return this.resetPasswordHelper.resetPassword(resetPasswordDto);
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
        return this.forgotPasswordSendOtpService.sendForgotPasswordOtp(forgotPasswordRequestDto);
    }

    async verifyOtpForgetPassword(forgotPasswordResetDto: ForgotPasswordResetDto) {
        return this.forgotPasswordVerifyAndResetService.verifyOtpAndResetPassword(forgotPasswordResetDto);
    }
}
