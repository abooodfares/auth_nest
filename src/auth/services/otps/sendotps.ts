import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { AUTH_SUCCESS_MESSAGES } from '../../constants/successMessages';
import { AUTH_ERROR_MESSAGES } from '../../constants/errorMessages';
import { SendOtpEmailDto, SendOtpPhoneDto } from '../../dto/auth_dto';
import { OtpCreationService } from './services/otp_creations';


@Injectable()
export class SendMessagesService {
  private resend: Resend;

  constructor(
    private otpCreationService: OtpCreationService
  ) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendOtpEmail(dto: SendOtpEmailDto) {
    const { email } = dto;
    try {
      // Create and save OTP
      const otp = await this.otpCreationService.createOtp(dto);

      // Send OTP email
      const { error } = await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: [email],
        subject: 'Your OTP Code',
        html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
      });

      if (error) {
        throw new Error(AUTH_ERROR_MESSAGES.FAILED_TO_SEND_OTP_EMAIL);
      }

      return AUTH_SUCCESS_MESSAGES.OTP_SENT;
    } catch (error) {
      throw error;
    }
  }

  async sendOtpPhone(dto: SendOtpPhoneDto) {
    const { phone } = dto;
    try {
      // Create and save OTP
      const otp = await this.otpCreationService.createOtp(dto);

      // TODO: Use phone SMS service to send OTP
      // Example: await this.smsService.send(phone, `Your OTP code is: ${otp}`);
      console.log(`OTP for ${phone}: ${otp}`);

      return AUTH_SUCCESS_MESSAGES.OTP_SENT;
    } catch (error) {
      throw error;
    }
  }
}
