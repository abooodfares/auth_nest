import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  UserLoginDto,
  UserRegisterDto,
  LogoutDto,
  RefreshTokenRequestDto,
  ResetPasswordDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResetDto,
  VerifyOtpRegisterDto,
  VerifyOtpLoginDto,
} from './dto/auth_dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { AUTH_SUCCESS_MESSAGES } from './constants/successMessages';
import { AUTH_CONTROLLER_NAMES } from './constants/controllerNames';
import { AuthGuard } from './services/jwt/guards/jwtGuard';
import { User } from './decorators/user.decorator';

@Controller(AUTH_CONTROLLER_NAMES.AUTH)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(AUTH_CONTROLLER_NAMES.REGISTER)
  @HttpCode(HttpStatus.OK)
  async register(@Body() createUserDto: UserRegisterDto): Promise<ApiResponse> {
    const data = await this.authService.register(createUserDto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: AUTH_SUCCESS_MESSAGES.REGISTER_OTP_SENT,
      data
    };
  }

  @Post(AUTH_CONTROLLER_NAMES.VERIFY_OTP_REGISTER)
  @HttpCode(HttpStatus.CREATED)
  async verifyOtpRegister(@Body() verifyOtpRegisterDto: VerifyOtpRegisterDto): Promise<ApiResponse> {
    const data = await this.authService.verifyOtpRegister(verifyOtpRegisterDto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: AUTH_SUCCESS_MESSAGES.REGISTER_SUCCESS,
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
      message: AUTH_SUCCESS_MESSAGES.LOGIN_OTP_SENT,
      data
    };
  }

  @Post(AUTH_CONTROLLER_NAMES.VERIFY_OTP_LOGIN)
  @HttpCode(HttpStatus.OK)
  async verifyOtpLogin(@Body() verifyOtpLoginDto: VerifyOtpLoginDto): Promise<ApiResponse> {
    const data = await this.authService.verifyOtpLogin(verifyOtpLoginDto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS,
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

  @Post(AUTH_CONTROLLER_NAMES.FORGOT_PASSWORD_REQUEST)
  @HttpCode(HttpStatus.OK)
  async forgetPassword(
    @Body() forgotPasswordRequestDto: ForgotPasswordRequestDto,
  ): Promise<ApiResponse> {
    const data = await this.authService.forgetPassword(forgotPasswordRequestDto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: AUTH_SUCCESS_MESSAGES.FORGOT_PASSWORD_OTP_SENT,
      data,
    };
  }

  @Post(AUTH_CONTROLLER_NAMES.FORGOT_PASSWORD_RESET)
  @HttpCode(HttpStatus.OK)
  async verifyOtpForgotPassword(
    @Body() forgotPasswordResetDto: ForgotPasswordResetDto,
  ): Promise<ApiResponse> {
    const data = await this.authService.verifyOtpForgetPassword(forgotPasswordResetDto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: AUTH_SUCCESS_MESSAGES.FORGOT_PASSWORD_RESET,
      data,
    };
  }
}
