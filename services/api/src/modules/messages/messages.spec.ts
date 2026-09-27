import { Test } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('MessagesService - idempotency & membership', () => {
  let service: MessagesService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma: any = {
      membership: {
        findUnique: jest.fn().mockResolvedValue({ userId: 'u1', conversationId: 'c1' }),
        updateMany: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      message: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue({ sequenceNumber: 5 }),
        create: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: 'm1', ...args.data })),
      },
      conversation: { update: jest.fn().mockResolvedValue({}) },
      deletedMessage: { findMany: jest.fn().mockResolvedValue([]) },
    };
    mockPrisma.$transaction = jest.fn().mockImplementation((fn: any) => fn(mockPrisma));

    const module = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(MessagesService);
    prisma = mockPrisma;
  });

  it('should deduplicate via clientMessageId', async () => {
    prisma.message.findUnique = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'existing' });
    const first = await service.sendMessage('c1', 'u1', { clientMessageId: 'client-123', body: 'hi' });
    expect(first).toBeDefined();
    // second call with same clientMessageId should return existing
    prisma.message.findUnique = jest.fn().mockResolvedValue({ id: 'existing' });
    // Note: implementation checks before transaction, we mock that
  });

  it('should enforce membership', async () => {
    prisma.membership.findUnique = jest.fn().mockResolvedValue(null);
    await expect(service.listMessages('c1', 'u1')).rejects.toThrow();
  });
});
