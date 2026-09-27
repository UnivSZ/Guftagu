import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async checkMembership(conversationId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of conversation');
    return membership;
  }

  async listMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
    await this.checkMembership(conversationId, userId);

    const take = Math.min(Math.max(limit, 1), 100);
    let where: any = { conversationId, isDeletedForEveryone: false };

    // Exclude deleted for me
    const deletedIds = await this.prisma.deletedMessage.findMany({
      where: { userId },
      select: { messageId: true },
    });
    const deletedSet = new Set(deletedIds.map(d => d.messageId));

    // Cursor is sequenceNumber or id? Use sequenceNumber for server ordering
    if (cursor) {
      const cursorSeq = parseInt(cursor, 10);
      if (!isNaN(cursorSeq)) {
        where.sequenceNumber = { lt: cursorSeq };
      }
    }

    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { sequenceNumber: 'desc' },
      take,
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        replyTo: { include: { sender: { select: { displayName: true } } } },
        reactions: true,
        attachments: true,
        receipts: { where: { userId: { not: userId } } },
      },
    });

    const filtered = messages.filter(m => !deletedSet.has(m.id));

    return {
      messages: filtered.reverse(), // chronological
      nextCursor: filtered.length > 0 ? filtered[0].sequenceNumber.toString() : null,
      hasMore: filtered.length === take,
    };
  }

  async sendMessage(conversationId: string, senderId: string, data: { clientMessageId: string; body?: string; type?: any; replyToId?: string; isForwarded?: boolean }) {
    await this.checkMembership(conversationId, senderId);

    if (!data.clientMessageId) throw new BadRequestException('clientMessageId required');
    if (!data.body && data.type === 'TEXT') throw new BadRequestException('Body required for text');

    // Idempotency check
    const existing = await this.prisma.message.findUnique({
      where: { senderId_clientMessageId: { senderId, clientMessageId: data.clientMessageId } },
    });
    if (existing) return existing;

    // Get next sequenceNumber per conversation
    return this.prisma.$transaction(async (tx) => {
      const last = await tx.message.findFirst({
        where: { conversationId },
        orderBy: { sequenceNumber: 'desc' },
        select: { sequenceNumber: true },
      });
      const nextSeq = (last?.sequenceNumber || 0) + 1;

      if (data.replyToId) {
        const replyTo = await tx.message.findFirst({ where: { id: data.replyToId, conversationId } });
        if (!replyTo) throw new NotFoundException('Reply message not found in conversation');
      }

      const message = await tx.message.create({
        data: {
          clientMessageId: data.clientMessageId,
          conversationId,
          senderId,
          body: data.body,
          type: data.type || 'TEXT',
          replyToId: data.replyToId,
          isForwarded: data.isForwarded || false,
          sequenceNumber: nextSeq,
        },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          replyTo: true,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date(), lastMessagePreview: data.body?.slice(0, 200) || `[${data.type}]` },
      });

      // Reset unread for sender, increment for others
      await tx.membership.updateMany({
        where: { conversationId, userId: { not: senderId } },
        data: { unreadCount: { increment: 1 } },
      });
      await tx.membership.update({
        where: { conversationId_userId: { conversationId, userId: senderId } },
        data: { lastReadSequence: nextSeq, unreadCount: 0 },
      });

      return message;
    });
  }

  async editMessage(messageId: string, userId: string, newBody: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.senderId !== userId) throw new ForbiddenException('Can only edit own messages');
    if (msg.isDeletedForEveryone) throw new BadRequestException('Message deleted');
    if (Date.now() - msg.createdAt.getTime() > 15 * 60 * 1000) throw new BadRequestException('Edit window expired (15m)');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { body: newBody, isEdited: true, editedAt: new Date() },
    });
  }

  async deleteForMe(messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');
    await this.checkMembership(msg.conversationId, userId);

    return this.prisma.deletedMessage.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: {},
      create: { messageId, userId },
    });
  }

  async deleteForEveryone(messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.senderId !== userId) throw new ForbiddenException('Only sender can delete for everyone');
    if (Date.now() - msg.createdAt.getTime() > 2 * 60 * 60 * 1000) throw new BadRequestException('Delete for everyone window expired (2h)');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isDeletedForEveryone: true, deletedForEveryoneAt: new Date(), body: null },
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');
    await this.checkMembership(msg.conversationId, userId);

    return this.prisma.reaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      update: {},
      create: { messageId, userId, emoji },
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    return this.prisma.reaction.deleteMany({ where: { messageId, userId, emoji } });
  }

  async markRead(conversationId: string, userId: string, lastReadSequence: number) {
    await this.checkMembership(conversationId, userId);
    await this.prisma.membership.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadSequence, unreadCount: 0 },
    });

    // Update receipts for messages up to sequence
    const messages = await this.prisma.message.findMany({
      where: { conversationId, sequenceNumber: { lte: lastReadSequence } },
      select: { id: true },
    });
    for (const m of messages) {
      await this.prisma.receipt.upsert({
        where: { messageId_userId: { messageId: m.id, userId } },
        update: { status: 'READ', readAt: new Date() },
        create: { messageId: m.id, userId, status: 'READ', readAt: new Date(), deliveredAt: new Date() },
      });
    }
    return { marked: true };
  }

  async markDelivered(messageId: string, userId: string, deviceId?: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.senderId === userId) return { skipped: true }; // sender doesn't need delivered
    await this.checkMembership(msg.conversationId, userId);

    return this.prisma.receipt.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: { status: 'DELIVERED', deliveredAt: new Date(), deviceId },
      create: { messageId, userId, status: 'DELIVERED', deliveredAt: new Date(), deviceId },
    });
  }

  async pinMessage(conversationId: string, messageId: string, userId: string) {
    await this.checkMembership(conversationId, userId);
    const msg = await this.prisma.message.findFirst({ where: { id: messageId, conversationId } });
    if (!msg) throw new NotFoundException('Message not found in conversation');
    return this.prisma.pinnedMessage.upsert({
      where: { conversationId_messageId: { conversationId, messageId } },
      update: {},
      create: { conversationId, messageId, pinnedById: userId },
    });
  }

  async unpinMessage(conversationId: string, messageId: string, userId: string) {
    await this.checkMembership(conversationId, userId);
    return this.prisma.pinnedMessage.deleteMany({ where: { conversationId, messageId } });
  }
}
