import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordService } from './services/password/password.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersQuery } from '../common/USERS_DB/usersQuary';
import { GenerateTokensService } from './services/jwt/services/genrateTokens';
import { HandleDeviceService } from './services/device/handleDevice';
import { TokensQuariesService } from './services/jwt/quaries/tokensQuaries';

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
  ],
})
export class AuthModule {}
