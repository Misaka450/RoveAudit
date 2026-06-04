import { SetMetadata } from '@nestjs/common';

/**
 * 权限装饰器 - 标记接口所需的操作权限
 * 用法：@Permission('report:download')
 */
export const PERMISSION_KEY = 'permission';
export const Permission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);