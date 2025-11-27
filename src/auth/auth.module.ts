import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordService } from './services/password/password.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersQuery } from '../common/USERS_DB/usersQuary';
import { GenerateTokensService } from './services/jwt/services/genrateTokens';
import { HandleDeviceService } from './services/device/handleDeviceCreation';
import { TokensQuariesService } from './services/jwt/quaries/tokensQuaries';

import { SendMessagesService } from './services/otps/sendotps';
import { OtpsQueries } from './services/otps/queries/otpsQueries';
import { OtpCreationService } from './services/otps/services/otp_creations';
import { CheckBlocksService } from './services/otps/blocks/checkBlocks';
import { ApplyTimeBlockService } from './services/otps/blocks/applyTimeBlock';
import { VerifyOtpService } from './services/otps/verify_otp';
import { DeviceQueries } from './services/device/deviceQueries';
import { AuthGuard } from './services/jwt/guards/jwtGuard';


@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersQuery,
    GenerateTokensService,
    PasswordService,
    HandleDeviceService,
    TokensQuariesService,
    SendMessagesService,
    OtpsQueries,
    OtpCreationService,
    CheckBlocksService,
    ApplyTimeBlockService,
    VerifyOtpService,
    DeviceQueries,
    AuthGuard,
  ],
})
export class AuthModule {}
