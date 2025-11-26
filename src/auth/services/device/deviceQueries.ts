import { PrismaService } from '../../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class DeviceQueries {
    constructor(private prisma: PrismaService) {}

    async findDeviceByFingerprint(fingerprint: string) {
        return await this.prisma.usersDevices.findUnique({
            where: { fingerprint },
        });
    }

    async createDevice(fingerprint: string, deviceName: string) {
        return await this.prisma.usersDevices.create({
            data: {
                fingerprint,
                deviceName,
            },
        });
    }

    async linkUserToDevice(userId: number, deviceFingerprint: string) {
        return await this.prisma.usersDevicesUserId.create({
            data: {
                user: { connect: { internalId: userId } },
                device: { connect: { fingerprint: deviceFingerprint } },
            },
        });
    }

    async findUserDeviceLink(userId: number, deviceFingerprint: string) {
        return await this.prisma.usersDevicesUserId.findFirst({
            where: {
                userId: userId,
                device: {
                    fingerprint: deviceFingerprint,
                },
            },
        });
    }

    async updateDevice(fingerprint: string, data: Prisma.UsersDevicesUpdateInput) {
        return await this.prisma.usersDevices.update({
            where: { fingerprint },
            data,
        });
    }

    async clearTimeBasedBlock(fingerprint: string) {
        return await this.prisma.usersDevices.update({
            where: { fingerprint },
            data: {
                blockedUntil: null,
                isBlocked: false,
            },
        });
    }

    async blockDevice(fingerprint: string, blockedAt: Date, blockedUntil: Date) {
        return await this.prisma.usersDevices.update({
            where: { fingerprint },
            data: {
                isBlocked: true,
                blockedAt,
                blockedUntil,
                blockCount: { increment: 1 },
            },
        });
    }

    async applyPermanentBlock(fingerprint: string) {
        return await this.prisma.usersDevices.update({
            where: { fingerprint },
            data: {
                foreverBlock: true,
                isBlocked: true,
            },
        });
    }
}
