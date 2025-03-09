import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import twilio from 'twilio';
import { storage } from '../storage';
import { randomInt } from 'crypto';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  try {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    console.log('OTP Service - Password hashed, length:', hashedPassword.length);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export class OTPService {
  private generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  private getExpiryTime(): Date {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 10); // OTP expires in 10 minutes
    return date;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[^\d+]/g, '');
  }

  async sendOTP(phoneNumber: string): Promise<boolean> {
    try {
      console.log('Attempting to send OTP to:', phoneNumber);
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      if (!formattedPhone.startsWith('+') || formattedPhone.length < 10) {
        throw new Error('Invalid phone number format. Must start with + and contain country code.');
      }

      const otp = this.generateOTP();
      const expiryTime = this.getExpiryTime();

      await storage.updateUserOTP(formattedPhone, otp, expiryTime);

      const message = await client.messages.create({
        body: `Your AItravelGlobe verification code is: ${otp}. Valid for 10 minutes.`,
        to: formattedPhone,
        from: process.env.TWILIO_PHONE_NUMBER,
      });

      console.log('OTP sent successfully, message SID:', message.sid);
      return true;
    } catch (error) {
      console.error('Error sending OTP:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to send OTP: ${error.message}`);
      }
      throw error;
    }
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const user = await storage.getUserByPhone(formattedPhone);

      if (!user) {
        console.log('User not found for phone number:', formattedPhone);
        return false;
      }

      console.log('Verifying OTP:', {
        storedOTP: user.otp,
        providedOTP: otp,
        expires: user.otp_expires,
        currentTime: new Date()
      });

      const isValid = user.otp === otp && 
                     user.otp_expires && 
                     new Date(user.otp_expires) > new Date();

      if (isValid) {
        // Create a strong password hash from the phone number
        const plainPassword = formattedPhone;
        const hashedPassword = await hashPassword(plainPassword);
        console.log('Created hashed password for verified phone user:', hashedPassword.length);

        // Update user with verified status and hashed password
        user.password = hashedPassword;
        await storage.verifyUserPhone(formattedPhone);
        console.log('Phone verification successful for:', formattedPhone);
        return true;
      }

      console.log('OTP verification failed for:', formattedPhone);
      return false;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  }
}

export const otpService = new OTPService();