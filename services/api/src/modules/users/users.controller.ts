import { Controller, Get, Patch, Body, Param, Query, UseGuards, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: any, @Body() body: any) {
    return this.usersService.updateMe(user.id, body);
  }

  @Get('by-username/:username')
  async getByUsername(@Param('username') username: string) {
    return this.usersService.getByUsername(username);
  }

  @Get('search')
  async search(@Query('q') q: string, @CurrentUser() user: any) {
    return this.usersService.search(q, user.id);
  }

  @Delete('me')
  async deleteMe(@CurrentUser() user: any) {
    return this.usersService.deleteAccount(user.id);
  }
}
