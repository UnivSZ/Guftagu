import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async updateMe(userId: string, data: { username?: string; displayName?: string; bio?: string; avatarUrl?: string }) {
    if (data.username) {
      const exists = await this.prisma.user.findFirst({
        where: { username: data.username, id: { not: userId } },
      });
      if (exists) throw new BadRequestException('Username taken');
    }
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async getByUsername(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    // Hide phone
    const { phone, phoneHash, ...safe } = user as any;
    return safe;
  }

  async search(query: string, currentUserId: string) {
    if (!query || query.length < 2) return [];
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        isDeleted: false,
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
    return users.map(u => {
      const { phone, phoneHash, ...safe } = u as any;
      return safe;
    });
  }

  async deleteAccount(userId: string) {
    // Explain: messages remain with recipients, user marked deleted, sessions revoked, PII removed where possible
    await this.prisma.$transaction(async (tx) => {
      await tx.session.updateMany({ where: { userId }, data: { revokedAt: new Date() } });
      await tx.pushToken.deleteMany({ where: { userId } });
      await tx.user.update({
        where: { id: userId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          phone: null,
          phoneHash: null,
          username: `deleted_${userId.slice(0, 8)}`,
          displayName: 'Deleted User',
          bio: null,
          avatarUrl: null,
        },
      });
      // Keep memberships but anonymized? For now keep for message history, but user can't access.
      await tx.membership.deleteMany({ where: { userId } });
    });
    return { message: 'Account deleted. Messages remain with recipients per retention policy.' };
  }
}
