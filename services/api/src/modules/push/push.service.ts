import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PushService {
  constructor(private prisma: PrismaService) {}

  async registerToken(userId: string, token: string, platform: string) {
    return this.prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  async removeToken(userId: string, token: string) {
    return this.prisma.pushToken.deleteMany({ where: { userId, token } });
  }

  async sendToUser(userId: string, payload: any) {
    // Placeholder: integrate FCM
    console.log(`[Push] Would send to ${userId}:`, payload);
    return { sent: true };
  }
}
