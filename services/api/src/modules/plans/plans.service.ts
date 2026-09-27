import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  private async checkMember(conversationId: string, userId: string) {
    const m = await this.prisma.membership.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
    if (!m) throw new ForbiddenException('Not member');
    return m;
  }

  async createPlan(conversationId: string, userId: string, data: any) {
    await this.checkMember(conversationId, userId);
    if (!data.title) throw new BadRequestException('Title required');
    if (!data.options || data.options.length === 0) throw new BadRequestException('At least one date option required');

    return this.prisma.plan.create({
      data: {
        conversationId,
        organizerId: userId,
        title: data.title,
        description: data.description,
        locationText: data.locationText,
        locationLink: data.locationLink,
        budget: data.budget,
        currency: data.currency,
        minParticipants: data.minParticipants,
        options: {
          create: data.options.map((opt: any) => ({
            startAt: new Date(opt.startAt),
            endAt: opt.endAt ? new Date(opt.endAt) : null,
            timeZone: opt.timeZone || 'UTC',
          })),
        },
      },
      include: { options: true },
    });
  }

  async listPlans(conversationId: string, userId: string) {
    await this.checkMember(conversationId, userId);
    return this.prisma.plan.findMany({
      where: { conversationId, isCancelled: false },
      include: { options: true, rsvps: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } }, votes: true, organizer: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async rsvp(planId: string, userId: string, status: 'IN' | 'MAYBE' | 'CANT') {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    await this.checkMember(plan.conversationId, userId);

    const rsvp = await this.prisma.planRsvp.upsert({
      where: { planId_userId: { planId, userId } },
      update: { status },
      create: { planId, userId, status },
    });

    // Check threshold
    if (plan.minParticipants) {
      const inCount = await this.prisma.planRsvp.count({ where: { planId, status: 'IN' } });
      if (inCount >= plan.minParticipants) {
        // Notify organiser - emit event (placeholder)
        console.log(`Plan ${planId} reached threshold ${inCount}/${plan.minParticipants}, notify organiser ${plan.organizerId}`);
      }
    }

    return rsvp;
  }

  async vote(planId: string, userId: string, optionId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    await this.checkMember(plan.conversationId, userId);

    const option = await this.prisma.planOption.findFirst({ where: { id: optionId, planId } });
    if (!option) throw new NotFoundException('Option not found');

    // Upsert one vote per user per plan (changeable)
    return this.prisma.planVote.upsert({
      where: { planId_userId: { planId, userId } },
      update: { optionId },
      create: { planId, optionId, userId },
    });
  }

  async confirm(planId: string, userId: string, optionId?: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.organizerId !== userId) throw new ForbiddenException('Only organiser can confirm');

    return this.prisma.plan.update({
      where: { id: planId },
      data: { isConfirmed: true, confirmedOptionId: optionId },
    });
  }

  async cancel(planId: string, userId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.organizerId !== userId) throw new ForbiddenException('Only organiser can cancel');
    return this.prisma.plan.update({ where: { id: planId }, data: { isCancelled: true, cancelledAt: new Date() } });
  }
}
