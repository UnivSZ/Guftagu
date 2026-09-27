import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Post('conversations/:id/plans')
  async create(@Param('id') convId: string, @CurrentUser() user: any, @Body() body: any) {
    return this.plansService.createPlan(convId, user.id, body);
  }

  @Get('conversations/:id/plans')
  async list(@Param('id') convId: string, @CurrentUser() user: any) {
    return this.plansService.listPlans(convId, user.id);
  }

  @Post('plans/:id/rsvp')
  async rsvp(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { status: 'IN' | 'MAYBE' | 'CANT' }) {
    return this.plansService.rsvp(id, user.id, body.status);
  }

  @Post('plans/:id/vote')
  async vote(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { optionId: string }) {
    return this.plansService.vote(id, user.id, body.optionId);
  }

  @Post('plans/:id/confirm')
  async confirm(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { optionId?: string }) {
    return this.plansService.confirm(id, user.id, body.optionId);
  }

  @Delete('plans/:id')
  async cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.plansService.cancel(id, user.id);
  }
}
