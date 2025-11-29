import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { VerifyOtpRegisterDto } from '../../dto/auth_dto';
import { PasswordService } from '../password/password.service';
import { UsersQuery } from '../../../common/USERS_DB/usersQuary';
import { VerifyOtpService } from '../otps/verify_otp';
import { HandleDeviceService } from '../device/handleDeviceCreation';
import { AUTH_ERROR_MESSAGES } from '../../constants/errorMessages';
import { AUTH_SUCCESS_MESSAGES } from '../../constants/successMessages';

@Injectable()
export class VerifyOtpRegisterService {
    constructor(
        private usersQuery: UsersQuery,
        private passwordService: PasswordService,
        private verifyOtpService: VerifyOtpService,
        private handleDeviceService: HandleDeviceService,
    ) {}

    async verifyOtpAndRegister(verifyOtpRegisterDto: VerifyOtpRegisterDto) {
        try {
            const { email, otpCode, fingerprint, deviceName, password } = verifyOtpRegisterDto;
            
            await this.verifyOtp(email, otpCode, fingerprint);
            
            const hashedPassword = await this.passwordService.hashPassword(password);
            
            const user = await this.createUser(verifyOtpRegisterDto, hashedPassword);
            
            await this.registerDevice(user.internal_id, fingerprint, deviceName);
            
            return {
                message: AUTH_SUCCESS_MESSAGES.REGISTER_SUCCESS,
            };
        } catch (error) {
            if (error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }
            throw new ConflictException(AUTH_ERROR_MESSAGES.Rigster_Later);
        }
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

    private async createUser(
        verifyOtpRegisterDto: VerifyOtpRegisterDto,
        hashedPassword: string
    ) {
        return await this.usersQuery.createUser({
            ...verifyOtpRegisterDto,
            password: hashedPassword,
        });
    }

    private async registerDevice(
        userId: number,
        fingerprint: string,
        deviceName: string
    ): Promise<void> {
        await this.handleDeviceService.handleDeviceForRegister(
            userId,
            fingerprint,
            deviceName
        );
    }
}
