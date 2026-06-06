import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../audit-log.service';

/**
 * 审计日志中间件 - 自动记录所有 API 请求
 * 排除健康检查、Swagger 文档等噪音路径
 */
@Injectable()
export class AuditMiddleware implements NestMiddleware {
  // 不需要记录日志的路径
  private readonly EXCLUDE_PATTERNS = [
    '/api-docs',
    '/health',
    '/favicon',
  ];

  constructor(private auditLogService: AuditLogService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // 跳过排除的路径
    if (this.EXCLUDE_PATTERNS.some(p => req.path.startsWith(p))) {
      return next();
    }

    // 监听响应完成事件
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const user = (req as any).user;

      // 只记录需要关注的请求（非 GET 或下载类）
      const shouldLog =
        req.method !== 'GET' || // 所有写操作
        req.path.includes('/download') || // 下载操作
        req.path.includes('/login') || // 登录
        res.statusCode >= 400; // 错误请求

      if (shouldLog) {
        this.auditLogService.log({
          userId: user?.userId,
          username: user?.username || 'anonymous',
          action: `${req.method} ${req.path}`,
          module: this.getModule(req.path),
          method: req.method,
          path: req.originalUrl,
          params: this.sanitizeParams(req),
          ip: req.ip || req.socket.remoteAddress,
          status: res.statusCode < 400 ? 1 : 0,
          duration,
        }).catch(() => {}); // 日志记录失败不影响主流程
      }
    });

    next();
  }

  private getModule(path: string): string {
    if (path.includes('/auth')) return '认证管理';
    if (path.includes('/users')) return '用户管理';
    if (path.includes('/roles')) return '角色管理';
    if (path.includes('/menus')) return '菜单管理';
    if (path.includes('/reports')) return '清单管理';
    if (path.includes('/download')) return '下载管理';
    if (path.includes('/warnings')) return '异常检测';
    if (path.includes('/data-query')) return '数据查询';
    if (path.includes('/audit-log')) return '审计日志';
    return '其他';
  }

  private sanitizeParams(req: Request): string {
    const { token, password, ...safe } = req.body || {};
    const sanitized = { ...safe };
    if (req.query && Object.keys(req.query).length > 0) {
      const { token: t, ...safeQuery } = req.query as any;
      sanitized.query = safeQuery;
    }
    try {
      return JSON.stringify(sanitized).slice(0, 2000);
    } catch {
      return '';
    }
  }
}
