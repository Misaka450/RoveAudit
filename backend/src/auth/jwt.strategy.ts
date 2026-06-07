import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { TOKEN_COOKIE_NAME } from './auth.controller';

/**
 * JWT 验证策略 - 支持从 Authorization Header 或 HttpOnly Cookie 中提取 Token
 * 优先使用 Header，兼容旧版客户端；Cookie 方式用于 XSS 防护
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
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
    });
  }

  /**
   * 验证通过后的回调 - 将 payload 放入 request.user
   */
  async validate(payload: any) {
    return {
      userId: payload.userId,
      username: payload.username,
      realName: payload.realName,
      permissions: payload.permissions || [],
      menus: payload.menus || [],
    };
  }
}