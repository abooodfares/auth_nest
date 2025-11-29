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
    const recentRequestCount = await this.otpsQueries.countRecentOtpRequests(
      email,
      phone,
      deviceFingerprint,
      AUTH_NUMERIC_CONSTANTS.OTP_RATE_LIMIT_WINDOW_MS
    );

    if (recentRequestCount >= AUTH_NUMERIC_CONSTANTS.OTP_RATE_LIMIT_MAX_ATTEMPTS) {
      await this.blockOtpRequests(email, phone, deviceFingerprint);
      throw new BadRequestException(AUTH_ERROR_MESSAGES.OTP_RATE_LIMIT_EXCEEDED);
    }
  }

  async blockOtpRequests(
    email?: string,
    phone?: string,
    deviceFingerprint?: string
  ): Promise<void> {
    const now = new Date();
    const blockedUntil = new Date(now.getTime() + AUTH_NUMERIC_CONSTANTS.OTP_RATE_LIMIT_BLOCK_DURATION_MS);

    if (deviceFingerprint) {
      const device = await this.deviceQueries.findDeviceByFingerprint(deviceFingerprint);
      if (device) {
        await this.deviceQueries.blockDevice(deviceFingerprint, now, blockedUntil);
      }
    }

    const user = email 
      ? await this.usersQuery.findUserByEmail(email)
      : phone 
      ? await this.usersQuery.findUserByPhone(phone)
      : null;

    if (user) {
      await this.usersQuery.blockUser(user.internal_id, now, blockedUntil);
    }
  }
}
