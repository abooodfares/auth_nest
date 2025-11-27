import { PrismaService } from '../../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class DeviceQueries {
    constructor(private prisma: PrismaService) {}

    async findDeviceByFingerprint(fingerprint: string) {
        return await this.prisma.user_device.findUnique({
            where: { fingerprint },
        });
    }

    async createDevice(fingerprint: string, deviceName: string) {
        return await this.prisma.user_device.create({
            data: {
                fingerprint,
                device_name: deviceName,
            },
        });
    }

    async linkUserToDevice(userId: number, deviceFingerprint: string) {
        return await this.prisma.user_Device_UserId.create({
            data: {
                users: { connect: { internal_id: userId } },
                User_device: { connect: { fingerprint: deviceFingerprint } },
            },
        });
    }

    async findUserDeviceLink(userId: number, deviceFingerprint: string) {
        return await this.prisma.user_Device_UserId.findFirst({
            where: {
                userid_fk: userId,
                User_device: {
                    fingerprint: deviceFingerprint,
                },
            },
        });
    }

    async updateDevice(fingerprint: string, data: Prisma.User_deviceUpdateInput) {
        return await this.prisma.user_device.update({
            where: { fingerprint },
            data,
        });
    }

    async clearTimeBasedBlock(fingerprint: string) {
        return await this.prisma.user_device.update({
            where: { fingerprint },
            data: {
                blocked_until: null,
                isblocked: false,
            },
        });
    }

    async blockDevice(fingerprint: string, blockedAt: Date, blockedUntil: Date) {
        return await this.prisma.user_device.update({
            where: { fingerprint },
            data: {
                isblocked: true,
                blocked_at: blockedAt,
                blocked_until: blockedUntil,
                block_count: { increment: 1 },
            },
        });
    }

    async applyPermanentBlock(fingerprint: string) {
        return await this.prisma.user_device.update({
            where: { fingerprint },
            data: {
                forever_block: true,
                isblocked: true,
            },
        });
    }
}
