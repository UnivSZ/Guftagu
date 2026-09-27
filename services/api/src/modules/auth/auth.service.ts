import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { OtpProvider, DevOtpProvider, TwilioOtpProvider } from './otp.provider';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otpProvider: OtpProvider;

  constructor(private prisma: PrismaService, private jwt: JwtService) {
    const provider = process.env.OTP_PROVIDER || 'dev';
    if (provider === 'twilio') this.otpProvider = new TwilioOtpProvider();
    else this.otpProvider = new DevOtpProvider();
  }

  private hashPhone(phone: string): string {
    return crypto.createHash('sha256').update(phone).digest('hex');
  }

  async requestOtp(phone: string) {
    const now = new Date();
    const cooldownSec = parseInt(process.env.OTP_RESEND_COOLDOWN_SEC || '60', 10);
    const expirySec = parseInt(process.env.OTP_EXPIRY_SEC || '300', 10);
    const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);

    // Find recent challenge
    const recent = await this.prisma.otpChallenge.findFirst({
      where: { phone, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      const diff = (now.getTime() - recent.lastSentAt.getTime()) / 1000;
      if (diff < cooldownSec) {
        throw new BadRequestException(`Please wait ${Math.ceil(cooldownSec - diff)}s before resending`);
      }
    }

    // Generate code
    let code: string;
    if (process.env.ALLOW_DEV_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
      code = process.env.DEV_OTP_CODE || '000000';
    } else {
      code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
    }

    const codeHash = await argon2.hash(code);
    const expiresAt = new Date(now.getTime() + expirySec * 1000);

    await this.prisma.otpChallenge.create({
      data: {
        phone,
        codeHash,
        expiresAt,
        maxAttempts,
      },
    });

    await this.otpProvider.sendOtp(phone, code);

    // Never reveal if user exists
    return { message: 'OTP sent if number is valid', expiresAt, devCode: process.env.NODE_ENV !== 'production' ? code : undefined };
  }

  async verifyOtp(phone: string, code: string, deviceName?: string, platform?: string, ip?: string) {
    const now = new Date();
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { phone, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge) throw new BadRequestException('OTP expired or not found');

    if (challenge.attempts >= challenge.maxAttempts) {
      throw new BadRequestException('Too many attempts');
    }

    const valid = await argon2.verify(challenge.codeHash, code);
    if (!valid) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid code');
    }

    // OTP valid -> delete all challenges for phone
    await this.prisma.otpChallenge.deleteMany({ where: { phone } });

    const phoneHash = this.hashPhone(phone);
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ phone }, { phoneHash }] },
    });

    const isNewUser = !user;
    if (!user) {
      // Create provisional user with random username
      const randomSuffix = crypto.randomBytes(3).toString('hex');
      user = await this.prisma.user.create({
        data: {
          phone,
          phoneHash,
          username: `user_${randomSuffix}`,
          displayName: `User ${randomSuffix}`,
        },
      });
    }

    // Create session
    const { accessToken, refreshToken, refreshHash, sessionId } = await this.createSession(user.id, user.username, phone);

    // Device
    if (platform || deviceName) {
      await this.prisma.device.upsert({
        where: { id: sessionId }, // hack: we use session id as device id? better create separate
        update: {},
        create: {
          userId: user.id,
          platform: platform || 'unknown',
          deviceName: deviceName || 'Unknown device',
        },
      }).catch(() => {
        // fallback create
        this.prisma.device.create({
          data: {
            userId: user.id,
            platform: platform || 'unknown',
            deviceName: deviceName || 'Unknown device',
          },
        });
      });
    }

    return {
      user,
      accessToken,
      refreshToken,
      isNewUser,
    };
  }

  private async createSession(userId: string, username: string, phone: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, username, phone },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' },
    );
    const refreshTokenRaw = crypto.randomBytes(32).toString('hex');
    const refreshHash = await argon2.hash(refreshTokenRaw);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30d

    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: refreshHash,
        expiresAt,
      },
    });

    const refreshToken = `${session.id}.${refreshTokenRaw}`;

    return { accessToken, refreshToken, refreshHash, sessionId: session.id };
  }

  async refresh(refreshToken: string) {
    const [sessionId, raw] = refreshToken.split('.');
    if (!sessionId || !raw) throw new UnauthorizedException('Invalid refresh token');

    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    const valid = await argon2.verify(session.refreshTokenHash, raw);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    // Rotate
    const newRaw = crypto.randomBytes(32).toString('hex');
    const newHash = await argon2.hash(newRaw);
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { refreshTokenHash: newHash, expiresAt: newExpiresAt },
    });

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, username: user.username, phone: user.phone },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' },
    );

    const newRefreshToken = `${sessionId}.${newRaw}`;
    return { accessToken, refreshToken: newRefreshToken, user };
  }

  async logout(sessionId: string) {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string, exceptSessionId?: string) {
    await this.prisma.session.updateMany({
      where: { userId, id: exceptSessionId ? { not: exceptSessionId } : undefined, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new BadRequestException('Session not found');
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  }
}
