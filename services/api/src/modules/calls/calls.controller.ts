import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calls')
export class CallsController {
  constructor(private callsService: CallsService) {}

  @Post()
  async initiate(@CurrentUser() user: any, @Body() body: { calleeId: string; type: 'AUDIO' | 'VIDEO'; conversationId?: string }) {
    return this.callsService.initiate(user.id, body.calleeId, body.type, body.conversationId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { status: string }) {
    return this.callsService.updateStatus(id, user.id, body.status);
  }

  @Get('history')
  async history(@CurrentUser() user: any) {
    return this.callsService.history(user.id);
  }
}
