import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BlocksService {
  constructor(private prisma: PrismaService) {}

  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new BadRequestException('Cannot block self');
    return this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId },
    });
  }

  async unblock(blockerId: string, blockedId: string) {
    return this.prisma.block.deleteMany({ where: { blockerId, blockedId } });
  }

  async list(blockerId: string) {
    return this.prisma.block.findMany({ where: { blockerId }, include: { blocked: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } });
  }

  async report(reporterId: string, data: any) {
    return this.prisma.report.create({
      data: {
        reporterId,
        targetUserId: data.targetUserId,
        targetGroupId: data.targetGroupId,
        targetMessageId: data.targetMessageId,
        reason: data.reason,
        details: data.details,
      },
    });
  }
}
