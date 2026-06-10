import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenBlacklistService } from '../token-blacklist.service';

/**
 * JWT 认证守卫 - 验证用户是否已登录
 * 自动跳过标记了 @Public() 的接口
 * 同时检查 Token 黑名单（已登出的 Token 立即失效）
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 如果是公开接口（如登录），直接放行
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // 从请求头或 Cookie 中获取 JWT Token
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request) || this.extractTokenFromCookie(request);
    if (!token) {
      throw new UnauthorizedException('请先登录');
    }

    try {
      // 验证 Token 并将用户信息挂到 request 上
      request['user'] = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }

    // 检查 Token 是否已被加入黑名单（登出后会失效）
    // 关键修复：之前 JwtStrategy 有这个逻辑但未被使用，导致登出后 Token 仍可用
    if (this.tokenBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token 已失效，请重新登录');
    }

    return true;
  }

  /**
   * 从请求头 Authorization: Bearer *** 中提取 Token
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * 从 Cookie 中提取 Token（HttpOnly Cookie 方式）
   */
  private extractTokenFromCookie(request: Request): string | undefined {
    const cookies = request.cookies;
    if (!cookies) return undefined;
    // 尝试读取 auth_token cookie
    return cookies['auth_token'] || cookies['token'] || undefined;
  }
}