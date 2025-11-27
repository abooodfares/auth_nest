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
    if (device.forever_block) {
      throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCESS_DENIED_PERMANENTLY_BLOCKED);
    }

    // Check if block count has reached threshold, apply permanent block
    if (device.block_count >= AUTH_NUMERIC_CONSTANTS.MAX_BLOCK_COUNT_FOR_PERMANENT_BLOCK && !device.forever_block) {
      await this.deviceQueries.applyPermanentBlock(deviceFingerprint);
      throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCESS_DENIED_PERMANENTLY_BLOCKED);
    }
    

    // 2. Block Until - Check if blocked until a specific time
    if (device.blocked_until) {
      const now = new Date();
      if (now < device.blocked_until) {
        const remainingMs = device.blocked_until.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / AUTH_NUMERIC_CONSTANTS.MILLISECONDS_PER_MINUTE);
        throw new ForbiddenException(
          `${AUTH_ERROR_MESSAGES.ACCESS_DENIED_BLOCKED_UNTIL} ${device.blocked_until.toISOString()}. Remaining time: ${remainingMinutes} minutes`
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
        if (user.Forever_block) {
          throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCESS_DENIED_PERMANENTLY_BLOCKED);
        }

        // Check if block count has reached threshold, apply permanent block
        if (user.block_count >= AUTH_NUMERIC_CONSTANTS.MAX_BLOCK_COUNT_FOR_PERMANENT_BLOCK && !user.Forever_block) {
          await this.usersQuery.applyPermanentBlock(user.internal_id);
          throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCESS_DENIED_PERMANENTLY_BLOCKED);
        }

        if (user.blocked_until) {
          const now = new Date();
          if (now < user.blocked_until) {
            const remainingMs = user.blocked_until.getTime() - now.getTime();
            const remainingMinutes = Math.ceil(remainingMs / AUTH_NUMERIC_CONSTANTS.MILLISECONDS_PER_MINUTE);
            throw new ForbiddenException(
              `${AUTH_ERROR_MESSAGES.ACCESS_DENIED_BLOCKED_UNTIL} ${user.blocked_until.toISOString()}. Remaining time: ${remainingMinutes} minutes`
            );
          } else {
            // Time has passed, clear the block
            await this.usersQuery.clearTimeBasedBlock(user.internal_id);
          }
        }
      }
    }

    // All checks passed, access is allowed
  }

}