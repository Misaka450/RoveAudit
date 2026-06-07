import { Injectable, Logger } from '@nestjs/common';

/**
 * Token 黑名单服务（内存实现）
 * 用于 JWT 撤销：登出时将 Token 加入黑名单，验证时拒绝已撤销的 Token
 *
 * 注意：服务重启后黑名单清空。部署 Redis 后应替换为 Redis 实现。
 */
@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  /** 黑名单存储 { tokenJti: expiresAt } */
  private blacklist = new Map<string, number>();

  /** 定期清理间隔（毫秒） */
  private readonly CLEANUP_INTERVAL = 60_000; // 1 分钟

  /** 定时清理任务引用 */
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * 将 Token 加入黑名单
   * @param token - 完整的 JWT Token 字符串
   * @param expiresAt - Token 过期时间（Unix 秒）
   */
  addToBlacklist(token: string, expiresAt: number): void {
    // 用 Token 的后 32 字符作为 key（足够唯一，不存储完整 Token）
    const tokenKey = token.slice(-32);
    this.blacklist.set(tokenKey, expiresAt);
    this.logger.log(`Token 已加入黑名单，当前黑名单大小: ${this.blacklist.size}`);
  }

  /**
   * 检查 Token 是否在黑名单中
   * @param token - 完整的 JWT Token 字符串
   * @returns true = 已撤销
   */
  isBlacklisted(token: string): boolean {
    const tokenKey = token.slice(-32);
    return this.blacklist.has(tokenKey);
  }

  /**
   * 获取当前黑名单大小（监控用）
   */
  get size(): number {
    return this.blacklist.size;
  }

  /**
   * 启动定期清理任务，删除过期的黑名单条目
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      let cleaned = 0;
      for (const [key, expiresAt] of this.blacklist.entries()) {
        if (expiresAt < now) {
          this.blacklist.delete(key);
          cleaned++;
        }
      }
      if (cleaned > 0) {
        this.logger.log(`黑名单清理了 ${cleaned} 条过期条目，当前大小: ${this.blacklist.size}`);
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
