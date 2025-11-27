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

    // Step 1: Check if device and user are blocked (forever or time-based)
    await this.checkBlocksService.validatedeviceanduserblock(
      deviceFingerprint,
      email,
      phone
    );

    // Step 2: Find OTP by email or phone
    const otp = await this.otpsQueries.findOtpByEmailOrPhone(email, phone);

    if (!otp) {
      throw new BadRequestException(AUTH_ERROR_MESSAGES.OTP_NOT_FOUND);
    }

    // Step 3: Check if OTP is pending and not expired
    const now = new Date();
    
    if (otp.status === OtpStatus.PENDING && otp.expires_at < now) {
      // Mark as expired in database
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

    // Step 4: Check if attempts have reached the maximum (5 or more)
    if (otp.attempts >= AUTH_NUMERIC_CONSTANTS.OTP_MAX_VERIFICATION_ATTEMPTS) {
      // Block OTP
      await this.otpsQueries.markOtpAsBlocked(otp.internal_id);
      
      // Block device and user
      await this.applyTimeBlockService.blockOtpRequests(email, phone, deviceFingerprint);
      
      throw new BadRequestException(AUTH_ERROR_MESSAGES.OTP_MAX_ATTEMPTS_REACHED);
    }

    // Step 5: Validate OTP code using constant-time comparison
    const otpBuffer = Buffer.from(otp.otp_code, 'utf8');
    const inputBuffer = Buffer.from(otpCode, 'utf8');
    
    // Ensure buffers are same length for timingSafeEqual
    const isValidOtp = otpBuffer.length === inputBuffer.length && 
                       timingSafeEqual(otpBuffer, inputBuffer);
    
    if (!isValidOtp) {
      // Increment attempts
      await this.otpsQueries.incrementOtpAttempts(otp.internal_id);
      
      const remainingAttempts = AUTH_NUMERIC_CONSTANTS.OTP_MAX_VERIFICATION_ATTEMPTS - (otp.attempts + 1);
      
      throw new BadRequestException(
        `${AUTH_ERROR_MESSAGES.OTP_INCORRECT} ${remainingAttempts} attempts remaining.`
      );
    }

    // Step 6: OTP is correct - mark as verified
    await this.otpsQueries.markOtpAsVerified(otp.internal_id);

    return {
      message: AUTH_SUCCESS_MESSAGES.OTP_VERIFIED,
      verified: true,
    };
  }
}