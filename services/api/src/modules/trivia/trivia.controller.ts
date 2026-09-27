import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TriviaService } from './trivia.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('trivia')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TriviaController {
  constructor(private triviaService: TriviaService) {}

  @Post('conversations/:id/trivia/start')
  async start(@Param('id') convId: string, @CurrentUser() user: any, @Body() body: { questionCount?: number }) {
    return this.triviaService.startSession(convId, user.id, body.questionCount || 5);
  }

  @Post('trivia/:sessionId/join')
  async join(@Param('sessionId') sessionId: string, @CurrentUser() user: any) {
    return this.triviaService.joinSession(sessionId, user.id);
  }

  @Get('trivia/:sessionId')
  async get(@Param('sessionId') sessionId: string, @CurrentUser() user: any) {
    return this.triviaService.getSession(sessionId, user.id);
  }

  @Post('trivia/:sessionId/answer')
  async answer(@Param('sessionId') sessionId: string, @CurrentUser() user: any, @Body() body: { questionId: string; selectedIndex: number }) {
    return this.triviaService.submitAnswer(sessionId, user.id, body.questionId, body.selectedIndex);
  }

  @Post('trivia/:sessionId/advance')
  async advance(@Param('sessionId') sessionId: string, @CurrentUser() user: any) {
    return this.triviaService.advanceState(sessionId, user.id);
  }

  @Post('trivia/:sessionId/abandon')
  async abandon(@Param('sessionId') sessionId: string, @CurrentUser() user: any) {
    return this.triviaService.abandon(sessionId, user.id);
  }

  @Get('trivia/:sessionId/leaderboard')
  async leaderboard(@Param('sessionId') sessionId: string, @CurrentUser() user: any) {
    return this.triviaService.getLeaderboard(sessionId, user.id);
  }
}
