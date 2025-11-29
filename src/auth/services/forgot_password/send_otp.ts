import { Injectable, BadRequestException } from '@nestjs/common';
import { ForgotPasswordRequestDto } from '../../dto/auth_dto';
import { UsersQuery } from '../../../common/USERS_DB/usersQuary';
import { SendMessagesService } from '../otps/sendotps';
import { AUTH_ERROR_MESSAGES } from '../../constants/errorMessages';
import { AUTH_SUCCESS_MESSAGES } from '../../constants/successMessages';
import { AUTH_ACTION_TYPES } from '../../constants/actionTypes';

@Injectable()
export class ForgotPasswordSendOtpService {
    constructor(
        private usersQuery: UsersQuery,
        private sendMessagesService: SendMessagesService,
    ) {}

    async sendForgotPasswordOtp(forgotPasswordRequestDto: ForgotPasswordRequestDto) {
        const { email, phone, deviceFingerprint } = forgotPasswordRequestDto;

        this.validateRequest(email, phone);

        try {
            const user = await this.findUserByEmailOrPhone(email, phone);

            if (!user) {
                throw new BadRequestException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
            }

            await this.sendOtpToUser(email, phone, deviceFingerprint);

            return { message: AUTH_SUCCESS_MESSAGES.FORGOT_PASSWORD_OTP_SENT };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(AUTH_ERROR_MESSAGES.FORGOT_PASSWORD_FAILED);
        }
    }

    private validateRequest(email: string | undefined, phone: string | undefined): void {
        if (!email && !phone) {
            throw new BadRequestException('Email or phone is required');
        }
    }

    private async findUserByEmailOrPhone(email?: string, phone?: string) {
        return email 
            ? await this.usersQuery.findUserByEmail(email)
            : phone 
            ? await this.usersQuery.findUserByPhone(phone)
            : null;
    }

    private async sendOtpToUser(
        email: string | undefined,
        phone: string | undefined,
        deviceFingerprint: string
    ): Promise<void> {
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
    }
}
