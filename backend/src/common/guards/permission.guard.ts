import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { CacheService } from '../cache.service';
import { PERMISSION_KEY } from '../decorators/permission.decorator';

/**
 * 权限守卫 - 验证用户是否拥有指定操作权限
 * 配合 @Permission('xxx') 装饰器使用
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取接口上标记的权限标识
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 没有标记权限的接口，默认放行
    if (!requiredPermission) return true;

    // 从 JWT 解析出的用户信息中获取用户 ID
    const request = context.switchToHttp().getRequest();
    const userId = request['user']?.userId;
    if (!userId) {
      throw new ForbiddenException('没有操作权限');
    }

    // 从缓存或数据库动态获取该用户最新权限列表
    const cacheKey = `user:permissions:${userId}`;
    let permissions = this.cacheService.get<string[]>(cacheKey);

    if (!permissions) {
      // 缓存未命中，从数据库中实时加载
      const perms = await this.dataSource.query(
        `SELECT DISTINCT p.permission_key
         FROM sys_user_role ur
         JOIN sys_role r ON ur.role_id = r.id
         JOIN sys_role_permission rp ON r.id = rp.role_id
         JOIN sys_permission p ON rp.permission_id = p.id
         WHERE ur.user_id = $1 AND r.status = 1`,
        [userId],
      );
      permissions = perms.map((p: any) => p.permission_key);
      // 缓存 5 分钟 (300 秒)
      this.cacheService.set(cacheKey, permissions, 300);
    }

    const currentPermissions = permissions || [];
    if (!currentPermissions.includes(requiredPermission)) {
      throw new ForbiddenException('没有操作权限');
    }

    return true;
  }
}