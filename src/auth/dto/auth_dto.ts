import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsDateString,
} from 'class-validator';

export class UserRegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @IsDateString({}, { message: 'Invalid date format' })
  @IsNotEmpty({ message: 'Birth date is required' })
  birthOfDate: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format',
  })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Device fingerprint is required' })
  fingerprint: string;

  @IsString()
  @IsNotEmpty({ message: 'Device name is required' })
  @MaxLength(100, { message: 'Device name must not exceed 100 characters' })
  deviceName: string;
}
export class UserLoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Device fingerprint is required' })
  fingerprint: string;

  @IsString()
  @IsNotEmpty({ message: 'Device name is required' })
  deviceName: string;
}
export class AccessTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'User UUID is required' })
  useruuid: string;

  @IsString()
  @IsNotEmpty({ message: 'Device fingerprint is required' })
  deviceFingerprint: string;
}
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'User UUID is required' })
  useruuid: string;

  @IsString()
  @IsNotEmpty({ message: 'Device fingerprint is required' })
  deviceFingerprint: string;

  @IsString()
  @IsNotEmpty({ message: 'Token hash is required' })
  tokenHash: string;

  @IsNotEmpty({ message: 'Expiration date is required' })
  expiresAt: Date;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Old password is required' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;

  // These fields will be populated from JWT token in the controller
  useruuid?: string;
  deviceFingerprint?: string;
}

export class LogoutDto {
  // These fields will be populated from JWT token in the controller
  useruuid?: string;
  deviceFingerprint?: string;
}

export class RefreshTokenRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;

  @IsString()
  @IsNotEmpty({ message: 'Device fingerprint is required' })
  deviceFingerprint: string;
}

export class SendOtpEmailDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Action is required' })
  action: string;

  @IsString()
  deviceFingerprint?: string;
}

export class SendOtpPhoneDto {
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format',
  })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Action is required' })
  action: string;

  @IsString()
  deviceFingerprint?: string;
}

export class CreateOtpDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsString()
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP code is required' })
  otpCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Action is required' })
  action: string;

  @IsNotEmpty({ message: 'Expiration date is required' })
  expiresAt: Date;

  @IsString()
  deviceFingerprint?: string;
}