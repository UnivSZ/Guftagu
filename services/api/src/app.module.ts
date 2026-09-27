import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { MessagesGateway } from './modules/messages/messages.gateway';
import { PlansModule } from './modules/plans/plans.module';
import { TriviaModule } from './modules/trivia/trivia.module';
import { MediaModule } from './modules/media/media.module';
import { PushModule } from './modules/push/push.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { CallsModule } from './modules/calls/calls.module';
import { SpacesModule } from './modules/spaces/spaces.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me-32chars',
    }),
    AuthModule,
    UsersModule,
    ConversationsModule,
    MessagesModule,
    PlansModule,
    TriviaModule,
    MediaModule,
    PushModule,
    BlocksModule,
    CallsModule,
    SpacesModule,
  ],
  providers: [MessagesGateway],
})
export class AppModule {}
