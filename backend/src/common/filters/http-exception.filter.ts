import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

/**
 * 全局异常过滤器 - 统一格式化所有错误响应
 * 返回格式：{ code, message, data }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

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

    // 统一响应格式
    response.status(status).json({
      code: status,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}