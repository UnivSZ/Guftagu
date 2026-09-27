import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { nanoid } from 'nanoid';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async listForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId, isDeletedForUser: false },
      include: {
        conversation: {
          include: {
            members: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
          },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { conversation: { lastMessageAt: 'desc' } }],
    });

    // For direct, resolve other participant name
    return memberships.map(m => {
      const conv = m.conversation;
      let displayName = conv.name;
      let avatarUrl = conv.avatarUrl;
      if (conv.type === 'DIRECT') {
        const other = conv.members.find(mm => mm.userId !== userId);
        if (other) {
          displayName = other.user.displayName;
          avatarUrl = other.user.avatarUrl || conv.avatarUrl;
        }
      }
      return {
        ...conv,
        displayName,
        avatarUrl,
        membership: {
          role: m.role,
          unreadCount: m.unreadCount,
          isArchived: m.isArchived,
          isPinned: m.isPinned,
          mutedUntil: m.mutedUntil,
          lastReadSequence: m.lastReadSequence,
        },
      };
    });
  }

  async getById(conversationId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member');
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true } } } },
        pinnedMessages: { include: { message: true }, take: 10, orderBy: { pinnedAt: 'desc' } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async createDirect(currentUserId: string, otherUserId: string) {
    if (currentUserId === otherUserId) throw new BadRequestException('Cannot create direct with self');

    const otherUser = await this.prisma.user.findUnique({ where: { id: otherUserId } });
    if (!otherUser || otherUser.isDeleted) throw new NotFoundException('User not found');

    // Check block
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: currentUserId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: currentUserId },
        ],
      },
    });
    if (block) throw new ForbiddenException('Cannot create conversation with blocked user');

    // Check existing direct
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        members: { every: { userId: { in: [currentUserId, otherUserId] } } },
        AND: [
          { members: { some: { userId: currentUserId } } },
          { members: { some: { userId: otherUserId } } },
        ],
      },
      include: { members: true },
    });
    // More precise: ensure exactly 2 members
    if (existing) {
      const count = await this.prisma.membership.count({ where: { conversationId: existing.id } });
      if (count === 2) return existing;
    }

    return this.prisma.conversation.create({
      data: {
        type: 'DIRECT',
        members: {
          create: [
            { userId: currentUserId, role: 'OWNER' },
            { userId: otherUserId, role: 'OWNER' },
          ],
        },
      },
      include: { members: true },
    });
  }

  async createGroup(currentUserId: string, data: { name: string; description?: string; memberIds: string[]; avatarUrl?: string }) {
    if (!data.name || data.name.trim().length < 2) throw new BadRequestException('Group name required');
    const uniqueMembers = Array.from(new Set([currentUserId, ...(data.memberIds || [])]));
    if (uniqueMembers.length < 2) throw new BadRequestException('Group needs at least 2 members');

    // Validate users exist
    const users = await this.prisma.user.findMany({ where: { id: { in: uniqueMembers }, isDeleted: false } });
    if (users.length !== uniqueMembers.length) throw new BadRequestException('Some users not found');

    return this.prisma.conversation.create({
      data: {
        type: 'GROUP',
        name: data.name,
        description: data.description,
        avatarUrl: data.avatarUrl,
        createdById: currentUserId,
        members: {
          create: uniqueMembers.map(uid => ({
            userId: uid,
            role: uid === currentUserId ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      include: { members: { include: { user: true } } },
    });
  }

  async updateGroup(conversationId: string, userId: string, data: any) {
    const membership = await this.prisma.membership.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
    if (!membership) throw new ForbiddenException('Not member');
    if (!['OWNER', 'ADMIN'].includes(membership.role)) throw new ForbiddenException('Admin only');

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        name: data.name,
        description: data.description,
        avatarUrl: data.avatarUrl,
        quote: data.quote,
        theme: data.theme,
        accentColor: data.accentColor,
      },
    });
  }

  async addMembers(conversationId: string, userId: string, memberIds: string[]) {
    const membership = await this.prisma.membership.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
    if (!membership) throw new ForbiddenException('Not member');
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv || conv.type !== 'GROUP') throw new BadRequestException('Only groups');

    // Check permission - for now OWNER/ADMIN can add, or if invite permission open, MEMBER too. Simplified: MEMBER can add
    // Validate
    const existingMembers = await this.prisma.membership.findMany({ where: { conversationId } });
    const existingIds = new Set(existingMembers.map(m => m.userId));
    const toAdd = memberIds.filter(id => !existingIds.has(id));
    if (toAdd.length === 0) return { added: 0 };

    const users = await this.prisma.user.findMany({ where: { id: { in: toAdd }, isDeleted: false } });
    if (users.length !== toAdd.length) throw new BadRequestException('Some users not found');

    await this.prisma.membership.createMany({
      data: toAdd.map(uid => ({ conversationId, userId: uid, role: 'MEMBER' as const })),
    });

    return { added: toAdd.length };
  }

  async removeMember(conversationId: string, requesterId: string, targetUserId: string) {
    const requesterMembership = await this.prisma.membership.findUnique({ where: { conversationId_userId: { conversationId, userId: requesterId } } });
    if (!requesterMembership) throw new ForbiddenException('Not member');

    const targetMembership = await this.prisma.membership.findUnique({ where: { conversationId_userId: { conversationId, userId: targetUserId } } });
    if (!targetMembership) throw new NotFoundException('Target not member');

    // Permissions: OWNER can remove anyone except self? ADMIN can remove MEMBER, OWNER can remove ADMIN/MEMBER, MEMBER can remove self (leave)
    if (requesterId !== targetUserId) {
      if (requesterMembership.role === 'MEMBER') throw new ForbiddenException('Members cannot remove others');
      if (requesterMembership.role === 'ADMIN' && targetMembership.role !== 'MEMBER') throw new ForbiddenException('Admin can only remove members');
    } else {
      // Leaving group - if owner, must transfer or delete group if last
      const ownerCount = await this.prisma.membership.count({ where: { conversationId, role: 'OWNER' } });
      if (targetMembership.role === 'OWNER' && ownerCount === 1) {
        const memberCount = await this.prisma.membership.count({ where: { conversationId } });
        if (memberCount > 1) throw new BadRequestException('Owner must transfer ownership before leaving');
      }
    }

    await this.prisma.membership.delete({ where: { conversationId_userId: { conversationId, userId: targetUserId } } });
    return { removed: true };
  }

  async createInviteLink(conversationId: string, userId: string, data: { expiresInHours?: number; maxUses?: number }) {
    const membership = await this.prisma.membership.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
    if (!membership) throw new ForbiddenException('Not member');
    if (!['OWNER', 'ADMIN'].includes(membership.role)) throw new ForbiddenException('Admin only');

    const code = nanoid(10);
    const expiresAt = data.expiresInHours ? new Date(Date.now() + data.expiresInHours * 3600 * 1000) : null;

    return this.prisma.inviteLink.create({
      data: {
        conversationId,
        code,
        createdById: userId,
        expiresAt,
        maxUses: data.maxUses,
      },
    });
  }

  async joinViaInvite(code: string, userId: string) {
    const link = await this.prisma.inviteLink.findUnique({ where: { code }, include: { conversation: true } });
    if (!link || link.isRevoked) throw new NotFoundException('Invite invalid');
    if (link.expiresAt && link.expiresAt < new Date()) throw new BadRequestException('Invite expired');
    if (link.maxUses && link.useCount >= link.maxUses) throw new BadRequestException('Invite max uses reached');

    const existing = await this.prisma.membership.findUnique({ where: { conversationId_userId: { conversationId: link.conversationId, userId } } });
    if (existing) return link.conversation;

    await this.prisma.$transaction([
      this.prisma.membership.create({ data: { conversationId: link.conversationId, userId, role: 'MEMBER' } }),
      this.prisma.inviteLink.update({ where: { id: link.id }, data: { useCount: { increment: 1 } } }),
    ]);

    return link.conversation;
  }

  async updateMembership(userId: string, conversationId: string, data: { isArchived?: boolean; isPinned?: boolean; mutedUntil?: Date | null }) {
    const membership = await this.prisma.membership.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
    if (!membership) throw new ForbiddenException('Not member');
    return this.prisma.membership.update({
      where: { conversationId_userId: { conversationId, userId } },
      data,
    });
  }
}
