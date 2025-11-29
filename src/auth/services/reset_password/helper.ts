import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ResetPasswordDto } from '../../dto/auth_dto';
import { PasswordService } from '../password/password.service';
import { UsersQuery } from '../../../common/USERS_DB/usersQuary';
import { AUTH_ERROR_MESSAGES } from '../../constants/errorMessages';
import { AUTH_SUCCESS_MESSAGES } from '../../constants/successMessages';
import { AUTH_NUMERIC_CONSTANTS } from '../../constants/numericConstants';
import { AUTH_ACTION_TYPES } from '../../constants/actionTypes';

@Injectable()
export class ResetPasswordHelper {
    constructor(
        private usersQuery: UsersQuery,
        private passwordService: PasswordService,
    ) {}

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const { oldPassword, newPassword, deviceFingerprint, useruuid } = resetPasswordDto;

        this.validateResetPasswordRequest(useruuid, deviceFingerprint);

        try {
            const user = await this.getUserAndValidatePassword(useruuid!, oldPassword!);
            const hashedNewPassword = await this.passwordService.hashPassword(newPassword);
            const lastAudit = await this.usersQuery.getLastAuditByUserId(user.internal_id);
            
            this.validatePasswordResetTiming(lastAudit);
            
            const auditData = this.prepareAuditData(
                user,
                hashedNewPassword,
                deviceFingerprint!,
                lastAudit
            );

            await this.usersQuery.updatePasswordWithAudit(
                user.internal_id,
                hashedNewPassword,
                auditData
            );

            return { message: AUTH_SUCCESS_MESSAGES.PASSWORD_RESET };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
                throw error;
            }
            throw new BadRequestException(AUTH_ERROR_MESSAGES.PASSWORD_RESET_FAILED);
        }
    }

    private validateResetPasswordRequest(
        useruuid: string | undefined,
        deviceFingerprint: string | undefined
    ): asserts useruuid is string {
        if (!useruuid || !deviceFingerprint) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
    }

    private async getUserAndValidatePassword(useruuid: string, oldPassword: string) {
        const user = await this.usersQuery.findUserByPublicId(useruuid);

        if (!user) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
        }

        const isPasswordValid = await this.passwordService.comparePassword(
            oldPassword,
            user.password
        );

        if (!isPasswordValid) {
            throw new BadRequestException(AUTH_ERROR_MESSAGES.INCORRECT_OLD_PASSWORD);
        }

        return user;
    }

    private validatePasswordResetTiming(lastAudit: any): void {
        if (lastAudit?.change_at) {
            const timeSinceLastAudit = Date.now() - new Date(lastAudit.change_at).getTime();
            if (timeSinceLastAudit < AUTH_NUMERIC_CONSTANTS.MILLISECONDS_PER_DAY) {
                throw new BadRequestException('Password can only be reset once every 24 hours');
            }
        }
    }

    private prepareAuditData(
        user: any,
        hashedPassword: string,
        deviceFingerprint: string,
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
            action_type: AUTH_ACTION_TYPES.PASSWORD_RESET,
            change_count: newChangeCount,
            period_end: periodEnd.toISOString(),
            device_fingerprint: deviceFingerprint,
        };
    }
}
