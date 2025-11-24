import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenDto, RefreshTokenDto } from '../../../dto/authDto';
import { TokensQuariesService } from '../quaries/tokensQuaries';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class GenerateTokensService {
    constructor(
        private jwtService: JwtService,
        private tokensQuaries: TokensQuariesService
    ) {}

    async generateAccessToken(accessTokenDto: AccessTokenDto) {
        const payload = accessTokenDto;
        return await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '1h'
        });
    }
    async generateRefreshToken(accessTokenDto: AccessTokenDto) {
        // Generate a secure random token using crypto
        const refreshToken = randomBytes(64).toString('hex');

        // Hash the token for storage using bcrypt
        const tokenHash = await bcrypt.hash(refreshToken, 10);

        // Calculate expiration date (2 weeks from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 14);

        // Create RefreshTokenDto
        const refreshTokenDto: RefreshTokenDto = {
            useruuid: accessTokenDto.useruuid,
            deviceFingerprint:accessTokenDto.deviceFingerprint,
            tokenHash,
            expiresAt
        };

        // Save to database
        await this.tokensQuaries.createRefreshToken(refreshTokenDto);

        return refreshToken;
    }

    async generateTokensforlogin(useruuid: string, deviceFingerprint: string) {
        const accessToken = await this.generateAccessToken({
            useruuid: useruuid,
            deviceFingerprint: deviceFingerprint
        });
        const refreshToken = await this.generateRefreshToken({
            useruuid: useruuid,
            deviceFingerprint: deviceFingerprint
        });

        return {
            access_token: accessToken,
            refreshToken: refreshToken
        };
    }
}


