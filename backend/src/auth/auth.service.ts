import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { CaptchaService } from './captcha.service';

/**
 * 认证服务 - 处理登录、JWT Token 签发
 *
 * 安全策略：连续输错密码 2 次后，要求填写图片验证码
 */
@Injectable()
export class AuthService {
  /** 登录失败计数器 { username: failCount } */
  private failCountMap = new Map<string, number>();

  /** 失败计数过期时间（毫秒）— 30 分钟后清零 */
  private readonly FAIL_COUNT_EXPIRE_MS = 30 * 60 * 1000;

  /** 失败计数时间戳 { username: lastFailAt } */
  private failTimestamp = new Map<string, number>();

  /** 触发验证码的失败次数阈值 */
  private readonly CAPTCHA_THRESHOLD = 2;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private captchaService: CaptchaService,
  ) {}

  /**
   * 检查是否需要验证码
   */
  private isCaptchaRequired(username: string): boolean {
    this.cleanupExpiredEntries();
    const count = this.failCountMap.get(username) || 0;
    return count >= this.CAPTCHA_THRESHOLD;
  }

  /**
   * 获取当前失败次数（前端用，决定是否展示验证码）
   */
  getFailCount(username: string): number {
    this.cleanupExpiredEntries();
    return this.failCountMap.get(username) || 0;
  }

  /**
   * 清理过期失败记录
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [username, ts] of this.failTimestamp.entries()) {
      if (now - ts > this.FAIL_COUNT_EXPIRE_MS) {
        this.failCountMap.delete(username);
        this.failTimestamp.delete(username);
      }
    }
  }

  /**
   * 用户登录 - 验证账号密码并返回 JWT Token
   */
  async login(loginDto: LoginDto) {
    const { username, password, captchaId, captcha } = loginDto;

    // 1. 检查是否需要验证码
    const needCaptcha = this.isCaptchaRequired(username);
    if (needCaptcha) {
      if (!captchaId || !captcha) {
        throw new UnauthorizedException({
          message: '请输入验证码',
          data: { failCount: this.getFailCount(username) },
        });
      }
      const valid = this.captchaService.verify(captchaId, captcha);
      if (!valid) {
        throw new BadRequestException({
          message: '验证码错误，请重新输入',
          data: { failCount: this.getFailCount(username) },
        });
      }
    }

    // 2. 查找用户（只查启用状态），只加载角色关系
    const user = await this.userRepository.findOne({
      where: { username, status: 1 },
      relations: ['roles'],
    });

    if (!user) {
      this.recordFail(username);
      const remain = this.getRemainAttempts(username);
      throw new UnauthorizedException({
        message:
          remain > 0
            ? `账号或密码错误，再输错 ${remain} 次将需要验证码`
            : '账号或密码错误',
        data: {
          failCount: this.getFailCount(username),
          remain,
        },
      });
    }

    // 3. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.recordFail(username);
      const remain = this.getRemainAttempts(username);
      throw new UnauthorizedException({
        message:
          remain > 0
            ? `账号或密码错误，再输错 ${remain} 次将需要验证码`
            : '账号或密码错误',
        data: {
          failCount: this.getFailCount(username),
          remain,
        },
      });
    }

    // 4. 登录成功 — 清零失败计数
    this.failCountMap.delete(username);
    this.failTimestamp.delete(username);

    // 5. 收集权限
    const permissions: string[] = [];
    const menus: string[] = [];
    const roles = user.roles || [];

    const activeRoleIds = roles.filter((r) => r.status === 1).map((r) => r.id);
    if (activeRoleIds.length > 0) {
      const perms = await this.userRepository.query(
        `SELECT DISTINCT p.permission_key
         FROM sys_role r
         JOIN sys_role_permission rp ON r.id = rp.role_id
         JOIN sys_permission p ON rp.permission_id = p.id
         WHERE r.id = ANY($1) AND r.status = 1`,
        [activeRoleIds],
      );
      for (const p of perms) {
        permissions.push(p.permission_key);
      }

      const menuList = await this.userRepository.query(
        `SELECT DISTINCT m.path
         FROM sys_role r
         JOIN sys_role_menu rm ON r.id = rm.role_id
         JOIN sys_menu m ON rm.menu_id = m.id
         WHERE r.id = ANY($1) AND r.status = 1 AND m.status = 1`,
        [activeRoleIds],
      );
      for (const m of menuList) {
        menus.push(m.path);
      }
    }

    // 6. 签发 JWT Token（带 jti 字段，用于 Token 黑名单唯一标识）
    const payload = {
      jti: crypto.randomUUID(),
      userId: user.id,
      username: user.username,
      realName: user.realName,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        department: user.department,
        permissions,
        menus,
      },
    };
  }

  /**
   * 记录失败次数
   */
  private recordFail(username: string): void {
    const current = this.failCountMap.get(username) || 0;
    this.failCountMap.set(username, current + 1);
    this.failTimestamp.set(username, Date.now());
  }

  /**
   * 获取剩余尝试次数（达到阈值前）
   */
  private getRemainAttempts(username: string): number {
    const count = this.failCountMap.get(username) || 0;
    const remain = this.CAPTCHA_THRESHOLD - count;
    return Math.max(0, remain);
  }

  /**
   * 验证 JWT Token 并返回 payload（不抛异常则验证通过）
   * 用于登出时从 Token 中提取过期时间等信息
   */
  verifyToken(token: string): { userId: number; exp: number } {
    return this.jwtService.verify(token);
  }
}
