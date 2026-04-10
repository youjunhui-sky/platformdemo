import { Controller, Post, Get, Body, UseGuards, Req, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GenerateTicketDto, ValidateTokenDto } from './dto/sso.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService,
  ) {}

  @Get('captcha')
  @Public()
  async getCaptcha() {
    const result = await this.captchaService.generate();
    return {
      id: result.id,
      image: result.image,
    };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);
    const userId = req.user?.sub;

    await this.authService.logout(token, userId);
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    return this.authService.refresh(refreshToken);
  }

  @Get('userinfo')
  @UseGuards(JwtAuthGuard)
  async getUserInfo(@CurrentUser('sub') userId: string) {
    return this.authService.getUserInfo(userId);
  }

  @Get('menus')
  @UseGuards(JwtAuthGuard)
  async getUserMenus(@CurrentUser('sub') userId: string) {
    return this.authService.getUserMenus(userId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(userId, dto);
    return { message: 'Password changed successfully' };
  }

  @Post('sso/ticket')
  @UseGuards(JwtAuthGuard)
  async generateSsoTicket(
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateTicketDto,
  ) {
    const ticket = await this.authService.generateSsoTicket(userId, dto);
    return { ticket };
  }

  @Get('sso/exchange/:ticket')
  @Public()
  async exchangeTicket(@Req() req: any) {
    const { ticket } = req.params;
    return this.authService.exchangeTicket(ticket);
  }

  @Get('sso/menu/:subsystemCode')
  @UseGuards(JwtAuthGuard)
  async getSsoMenu(
    @CurrentUser('sub') userId: string,
    @Req() req: any,
  ) {
    const { subsystemCode } = req.params;
    return this.authService.getUserMenuTree(userId, subsystemCode);
  }

  @Post('sso/validate')
  @Public()
  async validateToken(@Body() dto: ValidateTokenDto) {
    const decoded = await this.authService.validateSubsystemToken(
      dto.token,
      dto.subsystemCode,
    );
    return decoded;
  }

  @Post('sso/force-logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async forceLogout(
    @CurrentUser('sub') userId: string,
    @Body('targetUserId') targetUserId: string,
  ) {
    await this.authService.forceLogout(userId, targetUserId);
    return { message: 'User force logged out successfully' };
  }
}