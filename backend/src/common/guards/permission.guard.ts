import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/permission.decorator';

/**
 * 权限守卫 - 验证用户是否拥有指定操作权限
 * 配合 @Permission('xxx') 装饰器使用
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取接口上标记的权限标识
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 没有标记权限的接口，默认放行
    if (!requiredPermission) return true;

    // 从 JWT 解析出的用户信息中获取权限列表
    const request = context.switchToHttp().getRequest();
    const permissions: string[] = request['user']?.permissions || [];

    if (!permissions.includes(requiredPermission)) {
      throw new ForbiddenException('没有操作权限');
    }

    return true;
  }
}