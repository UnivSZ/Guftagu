import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> socketIds

  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token as string) || (client.handshake.query?.token as string);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_ACCESS_SECRET });
      const userId = payload.sub;
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.isDeleted) {
        client.disconnect();
        return;
      }

      (client as any).userId = userId;
      client.join(`user:${userId}`);

      // Join all conversation rooms
      const memberships = await this.prisma.membership.findMany({ where: { userId }, select: { conversationId: true } });
      for (const m of memberships) {
        client.join(`conversation:${m.conversationId}`);
      }

      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`User ${userId} connected ${client.id}`);
      client.emit('connected', { userId });

      // Presence broadcast
      this.server.emit('presence:update', { userId, status: 'online' });
    } catch (e) {
      this.logger.warn(`WS auth failed: ${e}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = (client as any).userId as string;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
        this.server.emit('presence:update', { userId, status: 'offline', lastSeenAt: new Date() });
        await this.prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } }).catch(() => {});
      }
    }
    this.logger.log(`Client disconnected ${client.id}`);
  }

  @SubscribeMessage('message:send')
  async handleMessageSend(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    // data: { conversationId, clientMessageId, body, type, replyToId }
    const userId = (client as any).userId;
    if (!userId) return { error: 'Unauthorized' };

    // Verify membership
    const membership = await this.prisma.membership.findUnique({
      where: { conversationId_userId: { conversationId: data.conversationId, userId } },
    });
    if (!membership) return { error: 'Not member' };

    // Check idempotency
    const existing = await this.prisma.message.findUnique({
      where: { senderId_clientMessageId: { senderId: userId, clientMessageId: data.clientMessageId } },
    });
    if (existing) {
      return { message: existing };
    }

    // Create message (same logic as service)
    const last = await this.prisma.message.findFirst({
      where: { conversationId: data.conversationId },
      orderBy: { sequenceNumber: 'desc' },
      select: { sequenceNumber: true },
    });
    const nextSeq = (last?.sequenceNumber || 0) + 1;

    const message = await this.prisma.message.create({
      data: {
        clientMessageId: data.clientMessageId,
        conversationId: data.conversationId,
        senderId: userId,
        body: data.body,
        type: data.type || 'TEXT',
        replyToId: data.replyToId,
        sequenceNumber: nextSeq,
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    await this.prisma.conversation.update({
      where: { id: data.conversationId },
      data: { lastMessageAt: new Date(), lastMessagePreview: data.body?.slice(0, 200) },
    });

    await this.prisma.membership.updateMany({
      where: { conversationId: data.conversationId, userId: { not: userId } },
      data: { unreadCount: { increment: 1 } },
    });

    // Emit to conversation room
    this.server.to(`conversation:${data.conversationId}`).emit('message:new', message);

    return { message };
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    const userId = (client as any).userId;
    client.to(`conversation:${data.conversationId}`).emit('typing', { conversationId: data.conversationId, userId, isTyping: true });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    const userId = (client as any).userId;
    client.to(`conversation:${data.conversationId}`).emit('typing', { conversationId: data.conversationId, userId, isTyping: false });
  }

  @SubscribeMessage('message:delivered')
  async handleDelivered(@ConnectedSocket() client: Socket, @MessageBody() data: { messageId: string }) {
    const userId = (client as any).userId;
    const msg = await this.prisma.message.findUnique({ where: { id: data.messageId } });
    if (!msg) return;
    if (msg.senderId === userId) return;

    await this.prisma.receipt.upsert({
      where: { messageId_userId: { messageId: data.messageId, userId } },
      update: { status: 'DELIVERED', deliveredAt: new Date() },
      create: { messageId: data.messageId, userId, status: 'DELIVERED', deliveredAt: new Date() },
    });

    this.server.to(`conversation:${msg.conversationId}`).emit('message:delivered', { messageId: data.messageId, userId });
  }

  @SubscribeMessage('message:read')
  async handleRead(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; lastReadSequence: number }) {
    const userId = (client as any).userId;
    await this.prisma.membership.update({
      where: { conversationId_userId: { conversationId: data.conversationId, userId } },
      data: { lastReadSequence: data.lastReadSequence, unreadCount: 0 },
    });

    // Mark receipts
    const messages = await this.prisma.message.findMany({
      where: { conversationId: data.conversationId, sequenceNumber: { lte: data.lastReadSequence } },
      select: { id: true },
    });
    for (const m of messages) {
      await this.prisma.receipt.upsert({
        where: { messageId_userId: { messageId: m.id, userId } },
        update: { status: 'READ', readAt: new Date() },
        create: { messageId: m.id, userId, status: 'READ', readAt: new Date(), deliveredAt: new Date() },
      });
    }

    this.server.to(`conversation:${data.conversationId}`).emit('message:read', { conversationId: data.conversationId, userId, lastReadSequence: data.lastReadSequence });
  }

  // Helper to emit new message from HTTP controller
  emitNewMessage(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('message:new', message);
  }
}
