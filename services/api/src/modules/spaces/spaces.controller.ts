import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('spaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SpacesController {
  constructor(private spacesService: SpacesService) {}

  @Get('spaces/themes')
  async themes() {
    return this.spacesService.getThemes();
  }

  @Get('spaces/:conversationId')
  async getSpace(@Param('conversationId') convId: string, @CurrentUser() user: any) {
    return this.spacesService.getSpace(convId, user.id);
  }
}
