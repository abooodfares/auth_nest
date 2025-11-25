import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RefreshTokenDto, LogoutDto, RefreshTokenRequestDto } from '../../../dto/auth_dto';
import { UsersQuery } from '../../../../common/USERS_DB/usersQuary';
import { AUTH_ERROR_MESSAGES } from 'src/auth/constants/errorMessages';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TokensQuariesService {
    constructor(
        private prisma: PrismaService,
        private usersQuery: UsersQuery,
    ) {}

    async createRefreshToken(refreshTokenDto: RefreshTokenDto) {
        // Find user by UUID (publicId)
        const user = await this.usersQuery.findUserByPublicId(
            refreshTokenDto.useruuid as string,
        );

        if (!user) {
            throw new Error(AUTH_ERROR_MESSAGES.invalid_credentials);
        }

        // Check if a token already exists for this userId and deviceFingerprint
        const existingToken = await this.prisma.refreshTokens.findFirst({
            where: {
                deviceFingerprint: refreshTokenDto.deviceFingerprint,
                userId: user.internalId,
            },
        });

        // If token exists, revoke it
        if (existingToken) {
            await this.prisma.refreshTokens.update({
                where: {
                    internalId: existingToken.internalId,
                },
                data: {
                    isRevoked: true,
                    revokedAt: new Date(),
                },
            });
        }

        // Create new token
        return await this.prisma.refreshTokens.create({
            data: {
                userId: user.internalId,
                deviceFingerprint: refreshTokenDto.deviceFingerprint,
                tokenHash: refreshTokenDto.tokenHash,
                expiresAt: refreshTokenDto.expiresAt,
            },
        });
    }

    async revokeRefreshToken(logoutDto: LogoutDto) {
        // Find user by UUID (publicId)
        const user = await this.usersQuery.findUserByPublicId(
            logoutDto.useruuid!,
        );

        if (!user) {
            throw new Error(AUTH_ERROR_MESSAGES.invalid_credentials);
        }

        // Find the refresh token for this user and device
        const refreshToken = await this.prisma.refreshTokens.findFirst({
            where: {
                userId: user.internalId,
                deviceFingerprint: logoutDto.deviceFingerprint,
                isRevoked: false,
            },
        });

        if (!refreshToken) {
            throw new Error(AUTH_ERROR_MESSAGES.TOKEN_NOT_FOUND);
        }

        // Revoke the token
        return await this.prisma.refreshTokens.update({
            where: {
                internalId: refreshToken.internalId,
            },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
            },
        });
    }

    async verifyRefreshToken(
    refreshTokenRequestDto:RefreshTokenRequestDto
    ) {
        // Find all non-revoked tokens for this device
        const storedTokens = await this.prisma.refreshTokens.findMany({
            where: {
                deviceFingerprint: refreshTokenRequestDto. deviceFingerprint,
                isRevoked: false,
            },
            include: {
                user: true,
            },
        });

        if (!storedTokens || storedTokens.length === 0) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.TOKEN_NOT_FOUND);
        }

        // Try to match the refresh token with stored hashes
        let matchedToken: typeof storedTokens[0] | null = null;
        for (const token of storedTokens) {
            const isMatch = await bcrypt.compare(refreshTokenRequestDto. refreshToken, token.tokenHash);
            if (isMatch) {
                matchedToken = token;
                break;
            }
        }

        if (!matchedToken) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
        }

        // Check if token is revoked
        if (matchedToken.isRevoked) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.TOKEN_REVOKED);
        }

        // Check if device fingerprint matches
        if (matchedToken.deviceFingerprint !== refreshTokenRequestDto. deviceFingerprint) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.DEVICE_MISMATCH);
        }

        // Check if token is expired
        if (new Date() > new Date(matchedToken.expiresAt)) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.TOKEN_EXPIRED);
        }

        return matchedToken;
    }
}
