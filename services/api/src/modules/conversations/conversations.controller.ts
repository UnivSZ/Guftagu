import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private convService: ConversationsService) {}

  @Get()
  async list(@CurrentUser() user: any) {
    return this.convService.listForUser(user.id);
  }

  @Get(':id')
  async getById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.convService.getById(id, user.id);
  }

  @Post('direct')
  async createDirect(@CurrentUser() user: any, @Body() body: { otherUserId: string }) {
    return this.convService.createDirect(user.id, body.otherUserId);
  }

  @Post('group')
  async createGroup(@CurrentUser() user: any, @Body() body: any) {
    return this.convService.createGroup(user.id, body);
  }

  @Patch(':id')
  async updateGroup(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.convService.updateGroup(id, user.id, body);
  }

  @Post(':id/members')
  async addMembers(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { memberIds: string[] }) {
    return this.convService.addMembers(id, user.id, body.memberIds);
  }

  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') targetUserId: string, @CurrentUser() user: any) {
    return this.convService.removeMember(id, user.id, targetUserId);
  }

  @Post(':id/invite-links')
  async createInvite(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.convService.createInviteLink(id, user.id, body);
  }

  @Post('join/:code')
  async joinViaInvite(@Param('code') code: string, @CurrentUser() user: any) {
    return this.convService.joinViaInvite(code, user.id);
  }

  @Patch(':id/membership')
  async updateMembership(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.convService.updateMembership(user.id, id, body);
  }
}
