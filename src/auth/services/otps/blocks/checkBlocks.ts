import { Injectable, ForbiddenException } from '@nestjs/common';
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
    const device = await this.deviceQueries.findDeviceByFingerprint(deviceFingerprint);
    
    if (device) {
      await this.checkDeviceBlocks(device, deviceFingerprint);
    }

    if (email || phone) {
      const user = email 
        ? await this.usersQuery.findUserByEmail(email)
        : await this.usersQuery.findUserByPhone(phone!);
      
      if (user) {
        await this.checkUserBlocks(user);
      }
    }
  }

  private async checkDeviceBlocks(device: any, deviceFingerprint: string): Promise<void> {
    if (device.forever_block) {
      throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCESS_DENIED_PERMANENTLY_BLOCKED);
    }

    if (device.block_count >= AUTH_NUMERIC_CONSTANTS.MAX_BLOCK_COUNT_FOR_PERMANENT_BLOCK) {
      await this.deviceQueries.applyPermanentBlock(deviceFingerprint);
      throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCESS_DENIED_PERMANENTLY_BLOCKED);
    }

    if (device.blocked_until) {
      const now = new Date();
      if (now < device.blocked_until) {
        const remainingMinutes = Math.ceil(
          (device.blocked_until.getTime() - now.getTime()) / AUTH_NUMERIC_CONSTANTS.MILLISECONDS_PER_MINUTE
        );
        throw new ForbiddenException(
          `${AUTH_ERROR_MESSAGES.ACCESS_DENIED_BLOCKED_UNTIL} ${device.blocked_until.toISOString()}. Remaining time: ${remainingMinutes} minutes`
        );
      }
      await this.deviceQueries.clearTimeBasedBlock(deviceFingerprint);
    }
  }

  private async checkUserBlocks(user: any): Promise<void> {
    if (user.Forever_block) {
      throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCESS_DENIED_PERMANENTLY_BLOCKED);
    }

    if (user.block_count >= AUTH_NUMERIC_CONSTANTS.MAX_BLOCK_COUNT_FOR_PERMANENT_BLOCK) {
      await this.usersQuery.applyPermanentBlock(user.internal_id);
      throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCESS_DENIED_PERMANENTLY_BLOCKED);
    }

    if (user.blocked_until) {
      const now = new Date();
      if (now < user.blocked_until) {
        const remainingMinutes = Math.ceil(
          (user.blocked_until.getTime() - now.getTime()) / AUTH_NUMERIC_CONSTANTS.MILLISECONDS_PER_MINUTE
        );
        throw new ForbiddenException(
          `${AUTH_ERROR_MESSAGES.ACCESS_DENIED_BLOCKED_UNTIL} ${user.blocked_until.toISOString()}. Remaining time: ${remainingMinutes} minutes`
        );
      }
      await this.usersQuery.clearTimeBasedBlock(user.internal_id);
    }
  }
}