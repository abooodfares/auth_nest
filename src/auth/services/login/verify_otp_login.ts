import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { VerifyOtpLoginDto } from '../../dto/auth_dto';
import { PasswordService } from '../password/password.service';
import { UsersQuery } from '../../../common/USERS_DB/usersQuary';
import { VerifyOtpService } from '../otps/verify_otp';
import { HandleDeviceService } from '../device/handleDeviceCreation';
import { GenerateTokensService } from '../jwt/services/genrateTokens';
import { AUTH_ERROR_MESSAGES } from '../../constants/errorMessages';
import { AUTH_SUCCESS_MESSAGES } from '../../constants/successMessages';

@Injectable()
export class VerifyOtpLoginService {
    constructor(
        private usersQuery: UsersQuery,
        private passwordService: PasswordService,
        private verifyOtpService: VerifyOtpService,
        private handleDeviceService: HandleDeviceService,
        private generateTokensService: GenerateTokensService,
    ) {}

    async verifyOtpAndLogin(verifyOtpLoginDto: VerifyOtpLoginDto) {
        try {
            const { email, otpCode, password, fingerprint, deviceName } = verifyOtpLoginDto;
            
            const user = await this.findAndValidateUser(email);
            
            await this.verifyOtp(email, otpCode, fingerprint);
            
            await this.validatePassword(password, user.password);
            
            await this.registerDevice(user.internal_id, fingerprint, deviceName);
            
            const tokens = await this.generateTokens(user.public_id, fingerprint);
            
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

    private async findAndValidateUser(email: string) {
        const user = await this.usersQuery.findUserByEmail(email);
        
        if (!user) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
        
        return user;
    }

    private async verifyOtp(
        email: string,
        otpCode: string,
        fingerprint: string
    ): Promise<void> {
        await this.verifyOtpService.verifyOtp({
            email,
            otpCode,
            deviceFingerprint: fingerprint,
        });
    }

    private async validatePassword(
        providedPassword: string,
        storedPassword: string
    ): Promise<void> {
        const isPasswordValid = await this.passwordService.comparePassword(
            providedPassword,
            storedPassword
        );
        
        if (!isPasswordValid) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
    }

    private async registerDevice(
        userId: number,
        fingerprint: string,
        deviceName: string
    ): Promise<void> {
        await this.handleDeviceService.handleDeviceForLogin(
            userId,
            fingerprint,
            deviceName
        );
    }

    private async generateTokens(userPublicId: string, fingerprint: string) {
        return await this.generateTokensService.generateTokensforlogin(
            userPublicId,
            fingerprint
        );
    }
}
