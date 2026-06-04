import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * 应用根控制器 - 健康检查接口
 */
@ApiTags('系统')
@Controller()
export class AppController {
  /**
   * 健康检查 - 验证服务是否正常运行
   */
  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}