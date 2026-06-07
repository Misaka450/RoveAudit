import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { TOKEN_COOKIE_NAME } from './auth.controller';
import { TokenBlacklistService } from '../common/token-blacklist.service';

/**
 * JWT 验证策略 - 支持从 Authorization Header 或 HttpOnly Cookie 中提取 Token
 * 优先使用 Header，兼容旧版客户端；Cookie 方式用于 XSS 防护
 * 同时检查 Token 黑名单（已登出的 Token 立即失效）
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    super({
      // 自定义 Token 提取器：优先取 Header，其次取 Cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => req?.cookies?.[TOKEN_COOKIE_NAME] || null,
      ]),
      // 不允许过期的 Token
      ignoreExpiration: false,
      // 使用配置中的密钥（main.ts 启动时已校验非空）
      secretOrKey: secret!,
      // 自定义回调：在验证签名后还检查黑名单
      passReqToCallback: true,
    });
  }

  /**
   * 验证通过后的回调 - 检查黑名单 + 将 payload 放入 request.user
   */
  async validate(req: Request, payload: any) {
    // 从请求中提取原始 Token 并检查是否在黑名单中
    const token =
      ExtractJwt.fromAuthHeaderAsBearerToken()(req) ||
      req?.cookies?.[TOKEN_COOKIE_NAME] ||
      null;

    if (token && this.tokenBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token 已失效，请重新登录');
    }

    return {
      userId: payload.userId,
      username: payload.username,
      realName: payload.realName,
      permissions: payload.permissions || [],
      menus: payload.menus || [],
    };
  }
}