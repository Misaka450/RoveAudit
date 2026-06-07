import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { TokenBlacklistService } from '../common/token-blacklist.service';

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
  ) {}

  /**
   * 用户登录 - 返回 JWT Token（body）并设置 HttpOnly Cookie
   */
  @Post('login')
  @Public()
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

    return result;
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
    if (token) {
      try {
        // 解析 JWT payload 获取过期时间（不验证签名，因为要解的就是当前 token）
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload?.exp) {
          this.tokenBlacklistService.addToBlacklist(token, payload.exp);
        }
      } catch {
        // 解析失败则忽略，仍然清除 Cookie
      }
    }

    res.clearCookie(TOKEN_COOKIE_NAME, { path: '/' });
    return { message: '已登出' };
  }
}