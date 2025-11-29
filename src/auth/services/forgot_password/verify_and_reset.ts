import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ForgotPasswordResetDto } from '../../dto/auth_dto';
import { PasswordService } from '../password/password.service';
import { UsersQuery } from '../../../common/USERS_DB/usersQuary';
import { VerifyOtpService } from '../otps/verify_otp';
import { AUTH_ERROR_MESSAGES } from '../../constants/errorMessages';
import { AUTH_SUCCESS_MESSAGES } from '../../constants/successMessages';
import { AUTH_NUMERIC_CONSTANTS } from '../../constants/numericConstants';
import { AUTH_ACTION_TYPES } from '../../constants/actionTypes';

@Injectable()
export class ForgotPasswordVerifyAndResetService {
    constructor(
        private usersQuery: UsersQuery,
        private passwordService: PasswordService,
        private verifyOtpService: VerifyOtpService,
    ) {}

    async verifyOtpAndResetPassword(forgotPasswordResetDto: ForgotPasswordResetDto) {
        const { email, phone, otpCode, newPassword, deviceFingerprint } = forgotPasswordResetDto;

        this.validateRequest(email, phone);

        try {
            await this.verifyOtp(email, phone, otpCode, deviceFingerprint);

            const user = await this.findUserByEmailOrPhone(email, phone);

            if (!user) {
                throw new BadRequestException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
            }

            const lastAudit = await this.usersQuery.getLastAuditByUserId(user.internal_id);
            
            this.validatePasswordChangePeriod(lastAudit);

            await this.updatePasswordWithAudit(user, newPassword, deviceFingerprint, lastAudit);

            return { message: AUTH_SUCCESS_MESSAGES.FORGOT_PASSWORD_RESET };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
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

    private async verifyOtp(
        email: string | undefined,
        phone: string | undefined,
        otpCode: string,
        deviceFingerprint: string
    ): Promise<void> {
        await this.verifyOtpService.verifyOtp({
            email,
            phone,
            otpCode,
            deviceFingerprint,
        });
    }

    private async findUserByEmailOrPhone(email?: string, phone?: string) {
        return email 
            ? await this.usersQuery.findUserByEmail(email)
            : phone 
            ? await this.usersQuery.findUserByPhone(phone)
            : null;
    }

    private validatePasswordChangePeriod(lastAudit: any): void {
        if (lastAudit) {
            const periodEnd = new Date(lastAudit.period_end);
            const now = new Date();
            const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
            const timeUntilPeriodEnd = periodEnd.getTime() - now.getTime();

            if (timeUntilPeriodEnd > 0 && timeUntilPeriodEnd < twoDaysInMs) {
                throw new BadRequestException(AUTH_ERROR_MESSAGES.CHANGE_LIMIT_REACHED);
            }
        }
    }

    private async updatePasswordWithAudit(
        user: any,
        newPassword: string,
        deviceFingerprint: string | undefined,
        lastAudit: any
    ): Promise<void> {
        const hashedNewPassword = await this.passwordService.hashPassword(newPassword);
        const auditData = this.prepareAuditData(user, hashedNewPassword, deviceFingerprint, lastAudit);

        await this.usersQuery.updatePasswordWithAudit(
            user.internal_id,
            hashedNewPassword,
            auditData
        );
    }

    private prepareAuditData(
        user: any,
        hashedPassword: string,
        deviceFingerprint: string | undefined,
        lastAudit: any
    ) {
        const newChangeCount = (lastAudit?.change_count || 0) + 1;
        const periodEnd = new Date(Date.now() + AUTH_NUMERIC_CONSTANTS.SUBSCRIPTION_PERIOD_MS);

        return {
            email: user.email,
            phone: user.phone || null,
            password: hashedPassword,
            is_absher: false,
            birth_of_date: new Date(user.birth_of_date),
            email_verified: user.email_verified,
            phone_verified: user.phone_verified,
            name: user.name,
            userid_fk: user.internal_id,
            change_at: new Date(),
            action_type: AUTH_ACTION_TYPES.FORGOT_PASSWORD,
            change_count: newChangeCount,
            period_end: periodEnd.toISOString(),
            device_fingerprint: deviceFingerprint || null,
        };
    }
}
