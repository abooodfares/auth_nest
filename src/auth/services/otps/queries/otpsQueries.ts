import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateOtpDto } from '../../../dto/auth_dto';
import { OtpStatus } from '../../../constants/otpStatus';

@Injectable()
export class OtpsQueries {
  constructor(private prisma: PrismaService) {}

  async createOtp(createOtpDto: CreateOtpDto) {
    return await this.prisma.otp_Tokens.create({
      data: {
        email: createOtpDto.email,
        otp_code: createOtpDto.otpCode,
        action: createOtpDto.action,
        expires_at: createOtpDto.expiresAt,
        devicefingerprint: createOtpDto.deviceFingerprint,
        status: OtpStatus.PENDING,
      },
    });
  }

  async findActiveOtp(email?: string, phone?: string, deviceFingerprint?: string) {
    const now = new Date();
    
    return await this.prisma.otp_Tokens.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
          deviceFingerprint ? { deviceFingerprint } : {},
        ].filter(condition => Object.keys(condition).length > 0),
        status: OtpStatus.PENDING,
        expires_at: {
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
    
    return await this.prisma.otp_Tokens.count({
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
    
    return await this.prisma.otp_Tokens.updateMany({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
          deviceFingerprint ? { deviceFingerprint } : {},
        ].filter(condition => Object.keys(condition).length > 0),
        status: OtpStatus.PENDING,
      },
      data: {
        status: OtpStatus.BLOCKED,
        blocked_at: now,
        
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
    
    const blockedOtp = await this.prisma.otp_Tokens.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
          deviceFingerprint ? { deviceFingerprint } : {},
        ].filter(condition => Object.keys(condition).length > 0),
        status: OtpStatus.BLOCKED,
        blocked_at: {
          gte: blockThreshold,
        },
      },
      orderBy: {
        blocked_at: 'desc',
      },
    });

    return !!blockedOtp;
  }

  async findOtpByEmailOrPhone(email?: string, phone?: string) {
    return await this.prisma.otp_Tokens.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
        ].filter(condition => Object.keys(condition).length > 0),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markOtpAsExpired(otpId: number) {
    return await this.prisma.otp_Tokens.update({
      where: {
        internal_id: otpId,
      },
      data: {
        status: OtpStatus.EXPIRED,
      },
    });
  }

  async incrementOtpAttempts(otpId: number) {
    return await this.prisma.otp_Tokens.update({
      where: {
        internal_id: otpId,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  }

  async markOtpAsVerified(otpId: number) {
    const now = new Date();
    return await this.prisma.otp_Tokens.update({
      where: {
        internal_id: otpId,
      },
      data: {
        status: OtpStatus.VERIFIED,
        verified_at: now,
      },
    });
  }

  async markOtpAsBlocked(otpId: number) {
    const now = new Date();
    return await this.prisma.otp_Tokens.update({
      where: {
        internal_id: otpId,
      },
      data: {
        status: OtpStatus.BLOCKED,
        blocked_at: now,
      },
    });
  }
}
