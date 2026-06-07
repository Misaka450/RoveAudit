import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

const logger = new Logger('ExceptionFilter');

/**
 * 全局异常过滤器 - 统一格式化所有错误响应
 * 返回格式：{ code, message, data, timestamp }
 *
 * 特性：
 * - HttpException 直接返回对应状态码和业务消息
 * - 生产环境隐藏 500 错误的详细信息（防止泄露堆栈/配置）
 * - 记录所有 5xx 错误到日志，便于排查
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // 确定状态码和错误信息
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || exception.message;
      // class-validator 校验错误时返回的是数组，取第一个
      if (Array.isArray(message)) {
        message = message[0];
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 5xx 错误：记录日志 + 生产环境隐藏详细信息
    if (status >= 500) {
      logger.error(
        `${request?.method} ${request?.url} → ${status}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
      // 生产环境不暴露内部错误细节
      if (process.env.NODE_ENV === 'production') {
        message = '服务器内部错误，请稍后重试';
      }
    }

    // 统一响应格式
    response.status(status).json({
      code: status,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
