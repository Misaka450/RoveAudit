import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import * as svgCaptcha from 'svg-captcha';

/**
 * 图片验证码服务
 * 生成 SVG 验证码图片，答案存储在内存 Map 中（key = captchaId）
 *
 * 注意：服务重启后验证码答案清空，不影响安全性（只需重新获取）
 */
@Injectable()
export class CaptchaService {
  /** 验证码答案存储 { captchaId: answer } */
  private store = new Map<string, string>();

  /** 验证码有效期（毫秒） */
  private readonly EXPIRE_MS = 5 * 60 * 1000; // 5 分钟

  /** 定时清理间隔 */
  private readonly CLEANUP_INTERVAL = 60_000; // 1 分钟

  /** 每条记录的时间戳 { captchaId: createdAt } */
  private timestamps = new Map<string, number>();

  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * 生成验证码
   * @returns { captchaId, svg } — captchaId 用于后续校验，svg 直接返回给前端
   */
  generate(): { captchaId: string; svg: string } {
    const captcha = svgCaptcha.create({
      size: 4,             // 4 位字符
      noise: 3,            // 干扰线数量
      color: true,         // 彩色
      background: '#f0f0f0',
      width: 120,
      height: 40,
      fontSize: 36,
      charPreset: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789', // 排除易混淆字符 0oO1lI
    });

    // 用 UUID 作为 captchaId（加密安全随机）
    const captchaId = crypto.randomUUID();
    const answer = captcha.text.toLowerCase();

    this.store.set(captchaId, answer);
    this.timestamps.set(captchaId, Date.now());

    return { captchaId, svg: captcha.data };
  }

  /**
   * 校验验证码
   * @param captchaId — 获取验证码时返回的 ID
   * @param answer — 用户输入的答案
   * @returns true = 校验通过（无论成功失败，都删除该验证码，一次性使用）
   */
  verify(captchaId: string, answer: string): boolean {
    const stored = this.store.get(captchaId);
    if (!stored) {
      return false; // 已过期或不存在
    }

    // 删除验证码（一次性使用，无论对错）
    this.store.delete(captchaId);
    this.timestamps.delete(captchaId);

    return stored === answer.toLowerCase();
  }

  /**
   * 定期清理过期验证码
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      for (const [id, ts] of this.timestamps.entries()) {
        if (now - ts > this.EXPIRE_MS) {
          this.store.delete(id);
          this.timestamps.delete(id);
          cleaned++;
        }
      }
      if (cleaned > 0) {
        // 生产环境可取消注释
        // this.logger.debug(`Captcha cleaned ${cleaned} expired entries`);
      }
    }, this.CLEANUP_INTERVAL);
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}
