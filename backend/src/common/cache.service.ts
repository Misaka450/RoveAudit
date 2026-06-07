import { Injectable, Logger } from '@nestjs/common';

/**
 * 内存缓存服务
 * 用于缓存不频繁变动的数据（如清单列表、字段配置），减少数据库查询
 * 注意：多实例部署下各实例缓存独立，建议生产环境使用 Redis
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  /** 缓存存储 { key: { value, expiresAt } } */
  private store = new Map<string, { value: any; expiresAt: number }>();

  /** 最大缓存条目数，超过时淘汰最旧条目 */
  private readonly maxItems: number;

  /** 记录插入顺序，用于 LRU 淘汰策略 */
  private readonly keyOrder: string[] = [];

  constructor(maxItems: number = 500) {
    this.maxItems = maxItems;
  }

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
   * @param ttl 过期时间（秒），默认 300 秒（5 分钟）
   */
  set(key: string, value: any, ttl: number = 300) {
    // 检查容量，超出时淘汰最旧的条目
    if (this.store.size >= this.maxItems && !this.store.has(key)) {
      const oldestKey = this.keyOrder.shift();
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    // 新键加入顺序队列
    if (!this.store.has(key)) {
      this.keyOrder.push(key);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  /** 删除缓存 */
  del(key: string) {
    this.store.delete(key);
    const idx = this.keyOrder.indexOf(key);
    if (idx > -1) this.keyOrder.splice(idx, 1);
  }

  /** 清空所有缓存 */
  clear() {
    this.store.clear();
    this.keyOrder.length = 0;
  }

  /**
   * 按前缀批量删除缓存
   * @param prefix 缓存键前缀，如 'reports:'
   */
  delByPrefix(prefix: string) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        const idx = this.keyOrder.indexOf(key);
        if (idx > -1) this.keyOrder.splice(idx, 1);
      }
    }
  }

  /** 当前缓存条目数 */
  get size(): number {
    return this.store.size;
  }
}