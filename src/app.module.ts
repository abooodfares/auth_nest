import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PasswordService } from './auth/services/password/password.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [],
  providers: [PasswordService],
})
export class AppModule {}

