import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CallsService {
  constructor(private prisma: PrismaService) {}

  async initiate(callerId: string, calleeId: string, type: 'AUDIO' | 'VIDEO', conversationId?: string) {
    // Check block etc
    return this.prisma.call.create({
      data: { callerId, calleeId, type, conversationId, status: 'RINGING' },
    });
  }

  async updateStatus(callId: string, userId: string, status: any) {
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');
    if (call.callerId !== userId && call.calleeId !== userId) throw new ForbiddenException('Not participant');
    return this.prisma.call.update({ where: { id: callId }, data: { status, endedAt: ['ENDED','DECLINED','MISSED','FAILED'].includes(status) ? new Date() : undefined } });
  }

  async history(userId: string) {
    return this.prisma.call.findMany({
      where: { OR: [{ callerId: userId }, { calleeId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
