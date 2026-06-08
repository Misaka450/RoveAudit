import { Controller, Post, Body, Res, Req, Get, Query, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { TokenBlacklistService } from '../common/token-blacklist.service';
import { CaptchaService } from './captcha.service';

/** Cookie 名称 - 与前端约定一致 */
export const TOKEN_COOKIE_NAME = 'auth_token';

/**
 * 认证控制器 - 登录/登出接口
 */
@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly captchaService: CaptchaService,
  ) {}

  /**
   * 获取图片验证码
   * 返回 SVG 图片，captchaId 通过响应头 X-Captcha-Id 返回
   * 限流：每分钟最多 30 次验证码请求，防止被恶意调用耗尽内存
   */
  @Get('captcha')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: '获取图片验证码' })
  getCaptcha(@Res() res: Response) {
    const { captchaId, svg } = this.captchaService.generate();
    res.setHeader('X-Captcha-Id', captchaId);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(svg);
  }

  /**
   * 查询指定账号的登录失败次数（用于页面刷新后同步状态）
   */
  @Get('fail-count')
  @Public()
  @ApiOperation({ summary: '查询账号登录失败次数' })
  @ApiQuery({ name: 'username', required: true, description: '用户账号' })
  getFailCount(@Query('username') username: string) {
    const failCount = this.authService.getFailCount(username);
    const remain = Math.max(0, 2 - failCount);
    return { failCount, remain };
  }

  /**
   * 用户登录 - 返回 JWT Token（body）并设置 HttpOnly Cookie
   * 连续输错 2 次密码后，需要填写验证码
   * 限流：每分钟最多 10 次登录尝试（防暴力破解）
   */
  @Post('login')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);

    // 设置 HttpOnly Cookie，防止 XSS 窃取 Token
    res.cookie(TOKEN_COOKIE_NAME, result.token, {
      httpOnly: true,       // 禁止 JS 读取，防止 XSS 窃取
      secure: process.env.NODE_ENV === 'production', // 生产环境仅允许 HTTPS
      sameSite: 'lax',      // 允许同站请求携带 Cookie
      maxAge: 24 * 60 * 60 * 1000, // Cookie 过期时间（24 小时，与 JWT 一致）
      path: '/',
    });

    return {
      userInfo: result.userInfo,
    };
  }

  /**
   * 用户登出 - 清除 Cookie + Token 加入黑名单
   */
  @Post('logout')
  @Public()
  @ApiOperation({ summary: '用户登出' })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // 将当前 Token 加入黑名单，使其立即失效
    const token = req.cookies?.[TOKEN_COOKIE_NAME] || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.clearCookie(TOKEN_COOKIE_NAME, { path: '/' });
      return { message: '已登出' };
    }

    // 验证 Token（提取 payload 中的 exp 等）
    try {
      const payload = this.authService.verifyToken(token);
      // 将 Token 加入黑名单
      this.tokenBlacklistService.addToBlacklist(token, payload.exp);
    } catch {
      // Token 解析失败则忽略，仍然清除 Cookie
    }

    res.clearCookie(TOKEN_COOKIE_NAME, { path: '/' });
    return { message: '已登出' };
  }
}
