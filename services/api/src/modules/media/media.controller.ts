import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload-url')
  async getUploadUrl(@CurrentUser() user: any, @Body() body: { fileName: string; mimeType: string; size: number }) {
    return this.mediaService.getPresignedUploadUrl(user.id, body.fileName, body.mimeType, body.size);
  }

  @Get('download-url')
  async getDownloadUrl(@Query('key') key: string) {
    return this.mediaService.getPresignedDownloadUrl(key);
  }
}
