import { Injectable } from '@nestjs/common';
import { UsersQuery } from '../../../common/USERS_DB/usersQuary';

@Injectable()
export class HandleDeviceService {
    constructor(private usersQuery: UsersQuery) {}

    async handleDeviceForRegister(
        userInternalId: number,
        fingerprint: string,
        deviceName: string
    ) {
        let device = await this.usersQuery.findDeviceByFingerprint(fingerprint);

        if (!device) {
            // Create new device if not found
            device = await this.usersQuery.createDevice(fingerprint, deviceName);
            // Link user to device
            await this.usersQuery.linkUserToDevice(userInternalId, device.internalId);
        } else {
            // Device exists, check if it's linked to this user
            const existingLink = await this.usersQuery.findUserDeviceLink(
                userInternalId,
                device.internalId
            );
            if (!existingLink) {
                // Link user to existing device
                await this.usersQuery.linkUserToDevice(userInternalId, device.internalId);
            }
        }

        return device;
    }

    async handleDeviceForLogin(
        userInternalId: number,
        fingerprint: string,
        deviceName: string
    ) {
        let device = await this.usersQuery.findDeviceByFingerprint(fingerprint);

        if (!device) {
            // Create new device if not found
            device = await this.usersQuery.createDevice(fingerprint, deviceName);
            // Link user to device
            await this.usersQuery.linkUserToDevice(userInternalId, device.internalId);
        } else {
            // Device exists, check if it's linked to this user
            const existingLink = await this.usersQuery.findUserDeviceLink(
                userInternalId,
                device.internalId
            );
            if (!existingLink) {
                // Link user to existing device
                await this.usersQuery.linkUserToDevice(userInternalId, device.internalId);
            }
        }

        return device;
    }
}
