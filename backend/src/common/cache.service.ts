import { Injectable, Logger } from '@nestjs/common';

/**
 * 内存缓存服务（LRU + TTL）
 * 用于缓存不频繁变动的数据（如清单列表、字段配置），减少数据库查询
 *
 * 特性：
 * - LRU 淘汰：超出容量时淘汰最久未访问的条目
 * - TTL 过期：自动清理过期条目
 * - 定期清理：后台定时扫描，防止过期条目堆积
 *
 * 注意：多实例部署下各实例缓存独立，建议生产环境使用 Redis
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  /** 缓存存储 { key: { value, expiresAt, lastAccess } } */
  private store = new Map<string, { value: any; expiresAt: number; lastAccess: number }>();

  /** 最大缓存条目数，超过时淘汰最旧条目 */
  private readonly maxItems: number;

  /** 定期清理间隔（毫秒） */
  private readonly CLEANUP_INTERVAL = 60_000; // 1 分钟

  /** 定时清理任务引用 */
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(maxItems: number = 500) {
    this.maxItems = maxItems;
    this.startCleanupTimer();
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
    // 更新访问时间（LRU）
    entry.lastAccess = Date.now();
    return entry.value as T;
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒），默认 300 秒（5 分钟）
   */
  set(key: string, value: any, ttl: number = 300) {
    // 检查容量，超出时淘汰最久未访问的条目
    if (this.store.size >= this.maxItems && !this.store.has(key)) {
      this.evictLRU();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
      lastAccess: Date.now(),
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

  /**
   * 按前缀批量删除缓存
   * @param prefix 缓存键前缀，如 'reports:'
   */
  delByPrefix(prefix: string) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** 当前缓存条目数 */
  get size(): number {
    return this.store.size;
  }

  /**
   * LRU 淘汰：移除最久未访问的条目
   */
  private evictLRU() {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }

  /**
   * 启动定期清理任务，删除过期的缓存条目
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.expiresAt) {
          this.store.delete(key);
          cleaned++;
        }
      }
      if (cleaned > 0) {
        this.logger.log(`缓存清理了 ${cleaned} 条过期条目，当前大小: ${this.store.size}`);
      }
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * 服务销毁时清理定时器
   */
  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}
