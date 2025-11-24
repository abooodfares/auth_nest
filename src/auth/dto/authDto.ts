export class UserRegisterDto {
  email: string;
  password: string;
  name: string;
  birthOfDate: string;
  phone: string;
  fingerprint: string;
  deviceName: string;
}
export class UserLoginDto {
  email: string;
  password: string;
  fingerprint: string;
  deviceName: string;
}
export class AccessTokenDto {
  useruuid: string;
  deviceFingerprint: string;
}
export class RefreshTokenDto {
  useruuid: string;
  deviceFingerprint: string;
  tokenHash: string;
  expiresAt: Date;
}

export class ResetPasswordDto {
  useruuid: string;
  oldPassword: string;
  newPassword: string;
  deviceFingerprint: string;
}

export class LogoutDto {
  useruuid: string;
  deviceFingerprint: string;
}

export class RefreshTokenRequestDto {
  refreshToken: string;
  deviceFingerprint: string;
}