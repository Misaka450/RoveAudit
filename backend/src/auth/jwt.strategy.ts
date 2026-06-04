import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * JWT 验证策略 - Passport 使用的 JWT 解析逻辑
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // 从请求头 Authorization: Bearer xxx 中提取 Token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 不允许过期的 Token
      ignoreExpiration: false,
      // 使用配置中的密钥
      secretOrKey: configService.get<string>('JWT_SECRET', 'default-secret'),
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