import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  UserLoginDto,
  UserRegisterDto,
  LogoutDto,
  RefreshTokenRequestDto,
  ResetPasswordDto,
} from './dto/authDto';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { AUTH_SUCCESS_MESSAGES } from './constants/successMessages';
import { AUTH_CONTROLLER_NAMES } from './constants/controllerNames';
import { AuthGuard } from './services/jwt/guards/jwtGuard';
import { User } from './decorators/user.decorator';

@Controller(AUTH_CONTROLLER_NAMES.AUTH)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(AUTH_CONTROLLER_NAMES.REGISTER)
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: UserRegisterDto): Promise<ApiResponse> {
    const data = await this.authService.register(createUserDto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: AUTH_SUCCESS_MESSAGES.REGISTER,
      data
    };
  }

  @Post(AUTH_CONTROLLER_NAMES.LOGIN)
  @HttpCode(HttpStatus.OK)
  async login(@Body() userLoginDto: UserLoginDto): Promise<ApiResponse> {
    const data = await this.authService.login(userLoginDto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: AUTH_SUCCESS_MESSAGES.LOGIN,
      data
    };
  }

  @Post(AUTH_CONTROLLER_NAMES.LOGOUT)
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async logout(
    @Body() logoutDto: LogoutDto,
    @User('useruuid') useruuid: string,
    @User('deviceFingerprint') deviceFingerprint: string,
  ): Promise<ApiResponse> {
    const data = await this.authService.logout({
      ...logoutDto,
      useruuid,
      deviceFingerprint,
    });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: AUTH_SUCCESS_MESSAGES.LOGOUT,
      data
    };
  }

  @Post(AUTH_CONTROLLER_NAMES.REFRESH)
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenRequestDto: RefreshTokenRequestDto,
  ): Promise<ApiResponse> {
    const data = await this.authService.refreshToken(refreshTokenRequestDto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: AUTH_SUCCESS_MESSAGES.REFRESH_TOKEN,
      data,
    };
  }

  @Post(AUTH_CONTROLLER_NAMES.RESET_PASSWORD)
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @User('useruuid') useruuid: string,
    @User('deviceFingerprint') deviceFingerprint: string,
  ): Promise<ApiResponse> {
    const data = await this.authService.resetPassword({
      ...resetPasswordDto,
      useruuid,
      deviceFingerprint,
    });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: AUTH_SUCCESS_MESSAGES.PASSWORD_RESET,
      data,
    };
  }
}
