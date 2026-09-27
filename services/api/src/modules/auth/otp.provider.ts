export interface OtpProvider {
  sendOtp(phone: string, code: string): Promise<void>;
  // For future providers that verify themselves
}

export class DevOtpProvider implements OtpProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    // In dev, log to console. Never in prod.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV OTP] Phone: ${phone} Code: ${code}`);
    }
  }
}

export class TwilioOtpProvider implements OtpProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    // Placeholder: integrate Twilio Verify if credentials present
    console.log(`[Twilio] Would send ${code} to ${phone}`);
    // Real implementation would use Twilio SDK
  }
}
