import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) {}

  private themes = [
    { id: 'DEFAULT', name: 'Default', colors: ['#0F4C4A', '#FDFCF8'], description: 'Clean teal & warm paper' },
    { id: 'SAFFRON_DUSK', name: 'Saffron Dusk', colors: ['#C86A2C', '#FFF3E6'], description: 'Warm sunset tones' },
    { id: 'MONSOON', name: 'Monsoon', colors: ['#2E6B62', '#E8F3F1'], description: 'Deep greens, rainy mood' },
    { id: 'BAZAAR', name: 'Bazaar', colors: ['#8B3A3A', '#FFF0F0'], description: 'Spiced market' },
    { id: 'HIMALAYA', name: 'Himalaya', colors: ['#3A5A8C', '#EDF2FB'], description: 'Mountain blues' },
    { id: 'PAPER', name: 'Paper', colors: ['#5A5A5A', '#FAFAF7'], description: 'Minimal ink on paper' },
  ];

  async getThemes() {
    return this.themes;
  }

  async getSpace(conversationId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
    if (!membership) throw new ForbiddenException('Not member');

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
        pinnedMessages: { include: { message: { include: { sender: { select: { displayName: true } } } } }, orderBy: { pinnedAt: 'desc' }, take: 5 },
      },
    });

    const upcomingPlans = await this.prisma.plan.findMany({
      where: { conversationId, isCancelled: false, isConfirmed: false },
      include: { options: true, rsvps: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const sharedMedia = await this.prisma.attachment.findMany({
      where: { message: { conversationId }, type: 'image' },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    return { conversation, upcomingPlans, sharedMedia, themes: this.themes };
  }
}
