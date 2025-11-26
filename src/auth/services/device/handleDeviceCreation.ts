import { Injectable } from '@nestjs/common';
import { DeviceQueries } from './deviceQueries';

@Injectable()
export class HandleDeviceService {
    constructor(private deviceQueries: DeviceQueries) {}

    async handleDeviceForRegister(
        userInternalId: number,
        fingerprint: string,
        deviceName: string
    ) {
        let device = await this.deviceQueries.findDeviceByFingerprint(fingerprint);

        if (!device) {
            // Create new device if not found
            device = await this.deviceQueries.createDevice(fingerprint, deviceName);
            // Link user to device
            await this.deviceQueries.linkUserToDevice(userInternalId, fingerprint);
        } else {
            // Device exists, check if it's linked to this user
            const existingLink = await this.deviceQueries.findUserDeviceLink(
                userInternalId,
                fingerprint
            );
            if (!existingLink) {
                // Link user to existing device
                await this.deviceQueries.linkUserToDevice(userInternalId, fingerprint);
            }
        }

        return device;
    }

    async handleDeviceForLogin(
        userInternalId: number,
        fingerprint: string,
        deviceName: string
    ) {
        let device = await this.deviceQueries.findDeviceByFingerprint(fingerprint);

        if (!device) {
            // Create new device if not found
            device = await this.deviceQueries.createDevice(fingerprint, deviceName);
            // Link user to device
            await this.deviceQueries.linkUserToDevice(userInternalId, fingerprint);
        } else {
            // Device exists, check if it's linked to this user
            const existingLink = await this.deviceQueries.findUserDeviceLink(
                userInternalId,
                fingerprint
            );
            if (!existingLink) {
                // Link user to existing device
                await this.deviceQueries.linkUserToDevice(userInternalId, fingerprint);
            }
        }

        return device;
    }
}
