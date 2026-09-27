import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Guftagu E2E - Two clients messaging', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('auth flow: request OTP and verify (dev)', async () => {
    const phone = '+910000000099';
    await request(app.getHttpServer()).post('/api/v1/auth/request-otp').send({ phone }).expect(201);

    const verifyRes = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ phone, code: '000000', platform: 'test', deviceName: 'jest' })
      .expect(201);

    expect(verifyRes.body.accessToken).toBeDefined();
    expect(verifyRes.body.refreshToken).toBeDefined();
    expect(verifyRes.body.user).toBeDefined();
  });

  // More tests: conversation creation, message send, idempotency, block, etc.
  // Requires DB - run with docker-compose up
});
