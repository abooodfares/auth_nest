import { Injectable, BadRequestException } from '@nestjs/common';
import { AUTH_NUMERIC_CONSTANTS } from '../../../constants/numericConstants';
import { OtpsQueries } from '../queries/otpsQueries';
import { SendOtpEmailDto, SendOtpPhoneDto } from '../../../dto/auth_dto';
import { CheckBlocksService } from '../blocks/checkBlocks';
import { ApplyTimeBlockService } from '../blocks/applyTimeBlock';
import { AUTH_ERROR_MESSAGES } from '../../../constants/errorMessages';

@Injectable()
export class OtpCreationService {
  constructor(
    private otpsQueries: OtpsQueries,
    private checkBlocksService: CheckBlocksService,
    private applyTimeBlockService: ApplyTimeBlockService
  ) {}

  generateOtp(): string {
    return Math.floor(AUTH_NUMERIC_CONSTANTS.OTP_MIN_VALUE + Math.random() * AUTH_NUMERIC_CONSTANTS.OTP_MAX_RANGE).toString();
  }

  calculateOtpExpiration(): Date {
    return new Date(Date.now() + AUTH_NUMERIC_CONSTANTS.OTP_EXPIRATION_MS);
  }

  async createOtp(dto: SendOtpEmailDto | SendOtpPhoneDto): Promise<string> {
    const { deviceFingerprint } = dto;
    const email = 'email' in dto ? dto.email : undefined;
    const phone = 'phone' in dto ? dto.phone : undefined;
    
    // Validate device access and blocking rules if deviceFingerprint is provided
    if (deviceFingerprint) {
      await this.checkBlocksService.validatedeviceanduserblock(
        deviceFingerprint,
        email,
        phone
      );
    }

    // Validate OTP rate limiting
    await this.applyTimeBlockService.validateOtpRateLimit(
      email,
      phone,
      deviceFingerprint
    );

    // Check if an active OTP already exists for this email, phone, or device
    const existingOtp = await this.otpsQueries.findActiveOtp(
      email,
      phone,
      deviceFingerprint
    );

    if (existingOtp) {
      throw new BadRequestException(AUTH_ERROR_MESSAGES.OTP_ALREADY_EXISTS);
    }
      
    // Generate 6-digit OTP
    const otp = this.generateOtp();

    // Calculate expiry time (5 minutes from now)
    const expiresAt = this.calculateOtpExpiration();
    const createOtpDto = { 
      ...dto,
      otpCode: otp,
      expiresAt 
    };
    // Save OTP to database
    await this.otpsQueries.createOtp(createOtpDto);

    return otp;
  }
}
