import { Controller, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('push')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('push')
export class PushController {
  constructor(private pushService: PushService) {}

  @Post('tokens')
  async register(@CurrentUser() user: any, @Body() body: { token: string; platform: string }) {
    return this.pushService.registerToken(user.id, body.token, body.platform);
  }

  @Delete('tokens')
  async remove(@CurrentUser() user: any, @Body() body: { token: string }) {
    return this.pushService.removeToken(user.id, body.token);
  }
}
