import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { UserLoginDto, UserRegisterDto } from '../../auth/dto/authDto';
import { Prisma } from '@prisma/client';

export type CreateUserData = Omit<UserRegisterDto, 'fingerprint' | 'deviceName'>;

@Injectable()
export class UsersQuery {
    constructor(private prisma: PrismaService) {}

    async createUser(data: CreateUserData) {
        return await this.prisma.users.create({
            data,
        });
    }

    async findUserByEmailAndPassword(data: Omit<UserLoginDto, 'fingerprint' | 'deviceName'>) {
        return await this.prisma.users.findFirst({
            where: data,
        });
    }

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

    async linkUserToDevice(userId: number, deviceId: number) {
        return await this.prisma.usersDevicesUserId.create({
            data: {
                userId,
                deviceId,
            },
        });
    }

    async findUserDeviceLink(userId: number, deviceId: number) {
        return await this.prisma.usersDevicesUserId.findFirst({
            where: {
                userId,
                deviceId,
            },
        });
    }

    async findUserByPublicId(publicId: string) {
        return await this.prisma.users.findUnique({
            where: { publicId },
        });
    }

    async findUserByInternalId(internalId: number) {
        return await this.prisma.users.findUnique({
            where: { internalId },
        });
    }

    async getLastAuditByUserId(userId: number) {
        return await this.prisma.usersAudit.findFirst({
            where: { userId },
            orderBy: { changeCount: 'desc' },
        });
    }

    async updatePasswordWithAudit(
        userId: number,
        hashedNewPassword: string,
        auditData: Prisma.UsersAuditCreateInput
    ) {
        return await this.prisma.$transaction(async (tx) => {
            // Update user password
            await tx.users.update({
                where: { internalId: userId },
                data: { password: hashedNewPassword },
            });

            // Create audit record with device fingerprint relation
            await tx.usersAudit.create({ data: auditData });
        });
    }
}
