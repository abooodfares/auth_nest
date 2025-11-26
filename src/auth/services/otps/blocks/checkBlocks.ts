import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UsersQuery } from '../../../../common/USERS_DB/usersQuary';
import { DeviceQueries } from '../../device/deviceQueries';
import { AUTH_ERROR_MESSAGES } from '../../../constants/errorMessages';
import { OtpsQueries } from '../queries/otpsQueries';
import { AUTH_NUMERIC_CONSTANTS } from '../../../constants/numericConstants';

@Injectable()
export class CheckBlocksService {
  constructor(
    private usersQuery: UsersQuery,
    private deviceQueries: DeviceQueries,
    private otpsQueries: OtpsQueries
  ) {}

  async validatedeviceanduserblock(
    deviceFingerprint: string,
    email?: string,
    phone?: string
  ): Promise<void> {
    // Get device information
    const device = await this.deviceQueries.findDeviceByFingerprint(deviceFingerprint);
    
    if (!device) {
      // Device doesn't exist yet, allow access
      return;
    }

    // 1. Block Forever - Check if permanently blocked
    if (device.foreverBlock) {
      throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCESS_DENIED_PERMANENTLY_BLOCKED);
    }

    // Check if block count has reached 5, apply permanent block
    if (device.blockCount >= 5 && !device.foreverBlock) {
      await this.deviceQueries.applyPermanentBlock(deviceFingerprint);
      throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCESS_DENIED_PERMANENTLY_BLOCKED);
    }
    

    // 2. Block Until - Check if blocked until a specific time
    if (device.blockedUntil) {
      const now = new Date();
      if (now < device.blockedUntil) {
        const remainingMs = device.blockedUntil.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
        throw new ForbiddenException(
          `${AUTH_ERROR_MESSAGES.ACCESS_DENIED_BLOCKED_UNTIL} ${device.blockedUntil.toISOString()}. Remaining time: ${remainingMinutes} minutes`
        );
      } else {
        // Time has passed, clear the block
        await this.deviceQueries.clearTimeBasedBlock(deviceFingerprint);
      }
    }

    // If we have email or phone, also check user-level blocking
    if (email || phone) {
      const user = email 
        ? await this.usersQuery.findUserByEmail(email)
        : phone 
        ? await this.usersQuery.findUserByPhone(phone)
        : null;

      if (user) {
        // Check user-level blocks
        if (user.foreverBlock) {
          throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCESS_DENIED_PERMANENTLY_BLOCKED);
        }

        // Check if block count has reached 5, apply permanent block
        if (user.blockCount >= 5 && !user.foreverBlock) {
          await this.usersQuery.applyPermanentBlock(user.internalId);
          throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCESS_DENIED_PERMANENTLY_BLOCKED);
        }

        if (user.blockedUntil) {
          const now = new Date();
          if (now < user.blockedUntil) {
            const remainingMs = user.blockedUntil.getTime() - now.getTime();
            const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
            throw new ForbiddenException(
              `${AUTH_ERROR_MESSAGES.ACCESS_DENIED_BLOCKED_UNTIL} ${user.blockedUntil.toISOString()}. Remaining time: ${remainingMinutes} minutes`
            );
          } else {
            // Time has passed, clear the block
            await this.usersQuery.clearTimeBasedBlock(user.internalId);
          }
        }
      }
    }

    // All checks passed, access is allowed
  }

}