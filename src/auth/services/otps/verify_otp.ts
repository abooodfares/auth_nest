import { Injectable, BadRequestException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { CheckBlocksService } from './blocks/checkBlocks';
import { OtpsQueries } from './queries/otpsQueries';
import { ApplyTimeBlockService } from './blocks/applyTimeBlock';
import { AUTH_ERROR_MESSAGES } from '../../constants/errorMessages';
import { AUTH_SUCCESS_MESSAGES } from '../../constants/successMessages';
import { AUTH_NUMERIC_CONSTANTS } from '../../constants/numericConstants';
import { VerifyOtpDto } from '../../dto/auth_dto';
import { OtpStatus } from '../../constants/otpStatus';

@Injectable()
export class VerifyOtpService {
  constructor(
    private checkBlocksService: CheckBlocksService,
    private otpsQueries: OtpsQueries,
    private applyTimeBlockService: ApplyTimeBlockService,
  ) {}

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, phone, otpCode, deviceFingerprint } = verifyOtpDto;

    await this.checkBlocksService.validatedeviceanduserblock(deviceFingerprint, email, phone);

    const otp = await this.otpsQueries.findOtpByEmailOrPhone(email, phone);
    if (!otp) {
      throw new BadRequestException(AUTH_ERROR_MESSAGES.OTP_NOT_FOUND);
    }

    await this.validateOtpStatus(otp);
    await this.validateOtpCode(otp, otpCode, email, phone, deviceFingerprint);
    await this.otpsQueries.markOtpAsVerified(otp.internal_id);

    return { message: AUTH_SUCCESS_MESSAGES.OTP_VERIFIED, verified: true };
  }

  private async validateOtpStatus(otp: any): Promise<void> {
    const now = new Date();
    
    if (otp.status === OtpStatus.PENDING && otp.expires_at < now) {
      await this.otpsQueries.markOtpAsExpired(otp.internal_id);
      throw new BadRequestException(AUTH_ERROR_MESSAGES.OTP_EXPIRED);
    }

    if (otp.status === OtpStatus.EXPIRED) {
      throw new BadRequestException(AUTH_ERROR_MESSAGES.OTP_EXPIRED);
    }

    if (otp.status === OtpStatus.BLOCKED) {
      throw new BadRequestException(AUTH_ERROR_MESSAGES.OTP_MAX_ATTEMPTS_REACHED);
    }

    if (otp.status === OtpStatus.VERIFIED) {
      throw new BadRequestException(AUTH_ERROR_MESSAGES.OTP_NOT_FOUND);
    }
  }

  private async validateOtpCode(
    otp: any,
    otpCode: string,
    email?: string,
    phone?: string,
    deviceFingerprint?: string
  ): Promise<void> {
    if (otp.attempts >= AUTH_NUMERIC_CONSTANTS.OTP_MAX_VERIFICATION_ATTEMPTS) {
      await this.otpsQueries.markOtpAsBlocked(otp.internal_id);
      await this.applyTimeBlockService.blockOtpRequests(email, phone, deviceFingerprint);
      throw new BadRequestException(AUTH_ERROR_MESSAGES.OTP_MAX_ATTEMPTS_REACHED);
    }

    const otpBuffer = Buffer.from(otp.otp_code, 'utf8');
    const inputBuffer = Buffer.from(otpCode, 'utf8');
    const isValidOtp = otpBuffer.length === inputBuffer.length && timingSafeEqual(otpBuffer, inputBuffer);
    
    if (!isValidOtp) {
      await this.otpsQueries.incrementOtpAttempts(otp.internal_id);
      const remainingAttempts = AUTH_NUMERIC_CONSTANTS.OTP_MAX_VERIFICATION_ATTEMPTS - (otp.attempts + 1);
      throw new BadRequestException(
        `${AUTH_ERROR_MESSAGES.OTP_INCORRECT} ${remainingAttempts} attempts remaining.`
      );
    }
  }
}