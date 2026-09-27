import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('blocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class BlocksController {
  constructor(private blocksService: BlocksService) {}

  @Post('blocks')
  async block(@CurrentUser() user: any, @Body() body: { blockedId: string }) {
    return this.blocksService.block(user.id, body.blockedId);
  }

  @Delete('blocks/:id')
  async unblock(@CurrentUser() user: any, @Param('id') blockedId: string) {
    return this.blocksService.unblock(user.id, blockedId);
  }

  @Get('blocks')
  async list(@CurrentUser() user: any) {
    return this.blocksService.list(user.id);
  }

  @Post('reports')
  async report(@CurrentUser() user: any, @Body() body: any) {
    return this.blocksService.report(user.id, body);
  }
}
