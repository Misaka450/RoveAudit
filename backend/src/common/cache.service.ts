import { Injectable } from '@nestjs/common';

/**
 * 简单的内存缓存服务
 * 用于缓存不频繁变动的数据（如清单列表、字段配置），减少数据库查询
 */
@Injectable()
export class CacheService {
  /** 缓存存储 { key: { value, expiresAt } } */
  private store = new Map<string, { value: any; expiresAt: number }>();

  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值，不存在或已过期返回 null
   */
  get<T = any>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒），默认 30 秒
   */
  set(key: string, value: any, ttl: number = 30) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  /** 删除缓存 */
  del(key: string) {
    this.store.delete(key);
  }

  /** 清空所有缓存 */
  clear() {
    this.store.clear();
  }
}