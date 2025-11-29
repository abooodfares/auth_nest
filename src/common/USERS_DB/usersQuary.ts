import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { UserLoginDto, UserRegisterDto } from '../../auth/dto/auth_dto';
import { Prisma } from '@prisma/client';

export type CreateUserData = {
    email: string;
    password: string;
    name: string;
    phone: string;
    birthOfDate: string;
};

export type AuditData = {
    email: string;
    phone?: string | null;
    password: string;
    is_absher: boolean;
    birth_of_date: Date;
    email_verified: boolean;
    phone_verified: boolean;
    name: string;
    userid_fk: number;
    change_at: Date;
    action_type: string;
    change_count: number;
    period_end: string;
    device_fingerprint?: string | null;
};

@Injectable()
export class UsersQuery {
    constructor(private prisma: PrismaService) {}

    async createUser(data: CreateUserData) {
        return await this.prisma.users.create({
            data: {
                email: data.email,
                password: data.password,
                name: data.name,
                phone: data.phone,
                birth_of_date: data.birthOfDate,
                updatedAt: new Date(),
            } as Prisma.usersCreateInput,
        });
    }

    async findUserByEmailAndPassword(data: Omit<UserLoginDto, 'fingerprint' | 'deviceName'>) {
        return await this.prisma.users.findFirst({
            where: data,
        });
    }

    async findUserByPublicId(publicId: string) {
        return await this.prisma.users.findUnique({
            where: { public_id: publicId },
        });
    }

    async findUserByInternalId(internalId: number) {
        return await this.prisma.users.findUnique({
            where: { internal_id: internalId },
        });
    }

    async getLastAuditByUserId(userId: number) {
        return await this.prisma.users_audit.findFirst({
            where: { userid_fk: userId },
            orderBy: { change_count: 'desc' },
        });
    }

    async updatePasswordWithAudit(
        userId: number,
        hashedNewPassword: string,
        auditData: AuditData
    ) {
        return await this.prisma.$transaction(async (tx) => {
            // Update user password
            await tx.users.update({
                where: { internal_id: userId },
                data: { password: hashedNewPassword },
            });

            // Create audit record
            await tx.users_audit.create({ data: auditData });
        });
    }

    async findUserByEmail(email: string) {
        return await this.prisma.users.findUnique({
            where: { email },
        });
    }

    async findUserByPhone(phone: string) {
        return await this.prisma.users.findUnique({
            where: { phone },
        });
    }

    async clearTimeBasedBlock(userId: number) {
        return await this.prisma.users.update({
            where: { internal_id: userId },
            data: {
                blocked_until: null,
                isblocked: false,
            },
        });
    }

    async blockUser(userId: number, blockedAt: Date, blockedUntil: Date) {
        return await this.prisma.users.update({
            where: { internal_id: userId },
            data: {
                isblocked: true,
                blocked_at: blockedAt,
                blocked_until: blockedUntil,
                block_count: { increment: 1 },
            },
        });
    }

    async applyPermanentBlock(userId: number) {
        return await this.prisma.users.update({
            where: { internal_id: userId },
            data: {
                Forever_block: true,
                isblocked: true,
            },
        });
    }
}
