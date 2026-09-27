import { Controller, Post, Body, Get, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto, RefreshDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('request-otp')
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: any) {
    const ip = req.ip;
    return this.authService.verifyOtp(dto.phone, dto.code, dto.deviceName, dto.platform, ip);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@CurrentUser() user: any) {
    return this.authService.getSessions(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  async revoke(@CurrentUser() user: any, @Param('id') id: string) {
    await this.authService.revokeSession(user.id, id);
    return { message: 'Revoked' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    // Extract session id from refresh token? For now logout current via access token not enough.
    // Client should send refresh token to revoke
    const auth = req.headers.authorization;
    // For simplicity, revoke all? Actually we need session id from payload - we store session id in refresh token only.
    // We'll expect body with refreshToken
    return { message: 'Use refresh token revocation via DELETE /auth/sessions/:id' };
  }
}
