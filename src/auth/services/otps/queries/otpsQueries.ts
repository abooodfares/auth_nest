import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateOtpDto } from '../../../dto/auth_dto';

@Injectable()
export class OtpsQueries {
  constructor(private prisma: PrismaService) {}

  async createOtp(createOtpDto: CreateOtpDto) {
    return await this.prisma.otps.create({
      data: {
        email: createOtpDto.email,
        otpCode: createOtpDto.otpCode,
        action: createOtpDto.action,
        expiresAt: createOtpDto.expiresAt,
        deviceFingerprint: createOtpDto.deviceFingerprint,
      },
    });
  }

  async findActiveOtp(email?: string, phone?: string, deviceFingerprint?: string) {
    const now = new Date();
    
    return await this.prisma.otps.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
          deviceFingerprint ? { deviceFingerprint } : {},
        ].filter(condition => Object.keys(condition).length > 0),
        status: 'PENDING',
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async countRecentOtpRequests(
    email?: string, 
    phone?: string, 
    deviceFingerprint?: string,
    timeWindowMs: number = 30 * 60 * 1000
  ): Promise<number> {
    const timeThreshold = new Date(Date.now() - timeWindowMs);
    
    return await this.prisma.otps.count({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
          deviceFingerprint ? { deviceFingerprint } : {},
        ].filter(condition => Object.keys(condition).length > 0),
        createdAt: {
          gte: timeThreshold,
        },
      },
    });
  }

  async blockOtpRequests(
    email?: string, 
    phone?: string, 
    deviceFingerprint?: string
  ) {
    const now = new Date();
    
    return await this.prisma.otps.updateMany({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
          deviceFingerprint ? { deviceFingerprint } : {},
        ].filter(condition => Object.keys(condition).length > 0),
        status: 'PENDING',
      },
      data: {
        status: 'BLOCKED',
        blockedAt: now,
        
      },
    });
  }

  async checkIfBlocked(
    email?: string, 
    phone?: string, 
    deviceFingerprint?: string,
    blockDurationMs: number = 60 * 60 * 1000
  ): Promise<boolean> {
    const blockThreshold = new Date(Date.now() - blockDurationMs);
    
    const blockedOtp = await this.prisma.otps.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
          deviceFingerprint ? { deviceFingerprint } : {},
        ].filter(condition => Object.keys(condition).length > 0),
        status: 'BLOCKED',
        blockedAt: {
          gte: blockThreshold,
        },
      },
      orderBy: {
        blockedAt: 'desc',
      },
    });

    return !!blockedOtp;
  }
}
