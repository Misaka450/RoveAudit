import { SetMetadata } from '@nestjs/common';

/**
 * 标记接口为公开访问（不需要登录），用于登录、健康检查等
 * 用法：@Public()
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);