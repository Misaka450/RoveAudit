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

/**
 * JWT 认证守卫 - 验证用户是否已登录
 * 自动跳过标记了 @Public() 的接口
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 如果是公开接口（如登录），直接放行
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // 从请求头中获取 JWT Token
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('请先登录');
    }

    try {
      // 验证 Token 并将用户信息挂到 request 上
      request['user'] = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }

    return true;
  }

  /**
   * 从请求头 Authorization: Bearer xxx 中提取 Token
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}