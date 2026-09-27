import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TriviaService {
  constructor(private prisma: PrismaService) {}

  private async checkMember(conversationId: string, userId: string) {
    const m = await this.prisma.membership.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
    if (!m) throw new ForbiddenException('Not member');
    return m;
  }

  async startSession(conversationId: string, userId: string, questionCount = 5) {
    await this.checkMember(conversationId, userId);
    const questions = await this.prisma.triviaQuestion.findMany({ take: questionCount, orderBy: { createdAt: 'asc' } });
    if (questions.length === 0) throw new NotFoundException('No trivia questions available');

    const session = await this.prisma.triviaSession.create({
      data: {
        conversationId,
        startedById: userId,
        state: 'LOBBY',
        questionIds: questions.map(q => q.id),
        participants: { create: { userId, score: 0 } },
      },
    });

    // Auto transition LOBBY -> QUESTION after 10s in real implementation via job. For now immediate.
    return { session, firstQuestion: null }; // hide questions
  }

  async joinSession(sessionId: string, userId: string) {
    const session = await this.prisma.triviaSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    await this.checkMember(session.conversationId, userId);

    if (session.state !== 'LOBBY') throw new BadRequestException('Session not in lobby');

    await this.prisma.triviaParticipant.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      update: {},
      create: { sessionId, userId, score: 0 },
    });

    return { joined: true };
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.triviaSession.findUnique({
      where: { id: sessionId },
      include: { participants: { include: { } }, answers: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.checkMember(session.conversationId, userId);

    // Hide correct answers unless REVEAL or FINISHED
    const questionIds = session.questionIds as string[];
    const questions = await this.prisma.triviaQuestion.findMany({ where: { id: { in: questionIds } } });

    const currentIdx = session.currentQuestionIndex;
    const sanitizedQuestions = questions.map((q, idx) => {
      if (session.state === 'REVEAL' && idx === currentIdx) {
        return q; // reveal current
      }
      if (session.state === 'FINISHED') {
        return q;
      }
      // hide correctIndex
      const { correctIndex, ...rest } = q as any;
      return rest;
    });

    return { session, questions: sanitizedQuestions };
  }

  async submitAnswer(sessionId: string, userId: string, questionId: string, selectedIndex: number) {
    const session = await this.prisma.triviaSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    await this.checkMember(session.conversationId, userId);

    if (session.state !== 'QUESTION') throw new BadRequestException('Not accepting answers now');

    const question = await this.prisma.triviaQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found');

    const questionIds = session.questionIds as string[];
    if (questionIds[session.currentQuestionIndex] !== questionId) throw new BadRequestException('Not current question');

    // Check existing answer
    const existing = await this.prisma.triviaAnswer.findUnique({
      where: { sessionId_questionId_userId: { sessionId, questionId, userId } },
    });
    if (existing) throw new BadRequestException('Already answered');

    const isCorrect = question.correctIndex === selectedIndex;

    const answer = await this.prisma.triviaAnswer.create({
      data: { sessionId, questionId, userId, selectedIndex, isCorrect },
    });

    if (isCorrect) {
      await this.prisma.triviaParticipant.update({
        where: { sessionId_userId: { sessionId, userId } },
        data: { score: { increment: 10 } },
      });
    }

    return answer;
  }

  async advanceState(sessionId: string, userId: string) {
    // Only starter can advance, or system
    const session = await this.prisma.triviaSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.startedById !== userId) throw new ForbiddenException('Only starter can advance');

    let nextState: any;
    let nextIndex = session.currentQuestionIndex;

    switch (session.state) {
      case 'LOBBY':
        nextState = 'QUESTION';
        break;
      case 'QUESTION':
        nextState = 'REVEAL';
        break;
      case 'REVEAL':
        const total = (session.questionIds as string[]).length;
        if (nextIndex + 1 >= total) {
          nextState = 'FINISHED';
        } else {
          nextState = 'QUESTION';
          nextIndex += 1;
        }
        break;
      default:
        throw new BadRequestException('Cannot advance');
    }

    return this.prisma.triviaSession.update({
      where: { id: sessionId },
      data: { state: nextState, currentQuestionIndex: nextIndex, endedAt: nextState === 'FINISHED' ? new Date() : undefined },
    });
  }

  async abandon(sessionId: string, userId: string) {
    const session = await this.prisma.triviaSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.startedById !== userId) throw new ForbiddenException('Only starter');
    return this.prisma.triviaSession.update({ where: { id: sessionId }, data: { state: 'ABANDONED', endedAt: new Date() } });
  }

  async getLeaderboard(sessionId: string, userId: string) {
    const session = await this.prisma.triviaSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    await this.checkMember(session.conversationId, userId);

    const participants = await this.prisma.triviaParticipant.findMany({
      where: { sessionId },
      orderBy: { score: 'desc' },
    });

    // Fetch user info
    const userIds = participants.map(p => p.userId);
    const users = await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, displayName: true, avatarUrl: true } });
    const userMap = new Map(users.map(u => [u.id, u]));

    return participants.map(p => ({ ...p, user: userMap.get(p.userId) }));
  }
}
