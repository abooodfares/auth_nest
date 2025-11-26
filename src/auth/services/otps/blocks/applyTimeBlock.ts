import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersQuery } from '../../../../common/USERS_DB/usersQuary';
import { DeviceQueries } from '../../device/deviceQueries';
import { OtpsQueries } from '../queries/otpsQueries';
import { AUTH_ERROR_MESSAGES } from '../../../constants/errorMessages';
import { AUTH_NUMERIC_CONSTANTS } from '../../../constants/numericConstants';

@Injectable()
export class ApplyTimeBlockService {
  constructor(
    private usersQuery: UsersQuery,
    private deviceQueries: DeviceQueries,
    private otpsQueries: OtpsQueries
  ) {}

  async validateOtpRateLimit(
    email?: string,
    phone?: string,
    deviceFingerprint?: string
  ): Promise<void> {

 
   
    // Check rate limiting: count OTP requests in the last 30 minutes
    const recentRequestCount = await this.otpsQueries.countRecentOtpRequests(
      email,
      phone,
      deviceFingerprint,
      AUTH_NUMERIC_CONSTANTS.OTP_RATE_LIMIT_WINDOW_MS
    );

    // If user has reached the limit, block them for 1 hour
    if (recentRequestCount >= AUTH_NUMERIC_CONSTANTS.OTP_RATE_LIMIT_MAX_ATTEMPTS) {
      await this.blockOtpRequests(email, phone, deviceFingerprint);
      throw new BadRequestException(AUTH_ERROR_MESSAGES.OTP_RATE_LIMIT_EXCEEDED);
    }
  }

  private async blockOtpRequests(
    email?: string,
    phone?: string,
    deviceFingerprint?: string
  ): Promise<void> {
    const now = new Date();
    const blockedUntil = new Date(now.getTime() + AUTH_NUMERIC_CONSTANTS.OTP_RATE_LIMIT_BLOCK_DURATION_MS);

    // Block OTP requests


    // Block device if fingerprint is provided 
    if (deviceFingerprint) {
      const device = await this.deviceQueries.findDeviceByFingerprint(deviceFingerprint);
      if (device) {
        await this.deviceQueries.blockDevice(deviceFingerprint, now, blockedUntil);
      }
    }

    // Block user if email or phone is provided
    if (email) {
      const user = await this.usersQuery.findUserByEmail(email);
      if (user) {
        await this.usersQuery.blockUser(user.internalId, now, blockedUntil);
      }
    } else if (phone) {
      const user = await this.usersQuery.findUserByPhone(phone);
      if (user) {
        await this.usersQuery.blockUser(user.internalId, now, blockedUntil);
      }
    }
  }
}
