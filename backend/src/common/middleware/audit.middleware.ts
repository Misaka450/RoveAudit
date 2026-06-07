import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../audit-log.service';

/** 需要脱敏的敏感字段名列表 */
const SENSITIVE_FIELDS = new Set(['token', 'password', 'secret', 'authorization']);

/**
 * 递归脱敏函数 - 深度遍历对象，移除所有敏感字段
 */
function deepSanitize(value: any, depth = 0): any {
  if (depth > 10) return '[深度过大]'; // 防止循环引用
  if (value == null) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => deepSanitize(item, depth + 1));
  }
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = '***';
    } else {
      sanitized[key] = deepSanitize(val, depth + 1);
    }
  }
  return sanitized;
}

/** 路径到模块名的映射表 */
const MODULE_MAP: Record<string, string> = {
  '/auth': '认证管理',
  '/users': '用户管理',
  '/roles': '角色管理',
  '/menus': '菜单管理',
  '/reports': '清单管理',
  '/download': '下载管理',
  '/warnings': '异常检测',
  '/data-query': '数据查询',
  '/audit-log': '审计日志',
};

/** 预排序的模块路径（按长度降序），避免每次查找都重新排序 */
const MODULE_KEYS = Object.keys(MODULE_MAP).sort((a, b) => b.length - a.length);

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
    const matchedKey = MODULE_KEYS.find((key) => path.includes(key));
    return matchedKey ? MODULE_MAP[matchedKey] : '其他';
  }

  private sanitizeParams(req: Request): string {
    // 对 body、query、params 做递归脱敏
    const sanitized: Record<string, any> = {};

    for (const key of ['body', 'query', 'params'] as const) {
      if (req[key] && typeof req[key] === 'object' && Object.keys(req[key]).length > 0) {
        sanitized[key] = deepSanitize(req[key]);
      }
    }

    if (Object.keys(sanitized).length === 0) return '';

    try {
      // 截断到 2000 字符，防止超长请求体撑爆日志表
      return JSON.stringify(sanitized).slice(0, 2000);
    } catch {
      return '';
    }
  }
}
