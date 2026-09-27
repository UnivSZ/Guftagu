import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('conversations/:id/messages')
  async list(
    @Param('id') conversationId: string,
    @CurrentUser() user: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.listMessages(conversationId, user.id, cursor, limit ? parseInt(limit, 10) : 50);
  }

  @Post('conversations/:id/messages')
  async send(
    @Param('id') conversationId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.messagesService.sendMessage(conversationId, user.id, body);
  }

  @Patch('messages/:id')
  async edit(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { body: string }) {
    return this.messagesService.editMessage(id, user.id, body.body);
  }

  @Delete('messages/:id/for-me')
  async deleteForMe(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.deleteForMe(id, user.id);
  }

  @Delete('messages/:id/for-everyone')
  async deleteForEveryone(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.deleteForEveryone(id, user.id);
  }

  @Post('messages/:id/reactions')
  async addReaction(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { emoji: string }) {
    return this.messagesService.addReaction(id, user.id, body.emoji);
  }

  @Delete('messages/:id/reactions/:emoji')
  async removeReaction(@Param('id') id: string, @Param('emoji') emoji: string, @CurrentUser() user: any) {
    return this.messagesService.removeReaction(id, user.id, emoji);
  }

  @Post('conversations/:id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { lastReadSequence: number }) {
    return this.messagesService.markRead(id, user.id, body.lastReadSequence);
  }

  @Post('messages/:id/delivered')
  async markDelivered(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { deviceId?: string }) {
    return this.messagesService.markDelivered(id, user.id, body.deviceId);
  }

  @Post('conversations/:id/pin/:messageId')
  async pin(@Param('id') convId: string, @Param('messageId') messageId: string, @CurrentUser() user: any) {
    return this.messagesService.pinMessage(convId, messageId, user.id);
  }

  @Delete('conversations/:id/pin/:messageId')
  async unpin(@Param('id') convId: string, @Param('messageId') messageId: string, @CurrentUser() user: any) {
    return this.messagesService.unpinMessage(convId, messageId, user.id);
  }
}
