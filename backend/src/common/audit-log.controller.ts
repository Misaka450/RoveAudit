import { Controller, Get, Delete, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';

@ApiTags('审计日志')
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: '查询审计日志列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词（用户名/操作）' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数' })
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.auditLogService.findAll({ keyword, page, pageSize });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除审计日志' })
  async remove(@Param('id') id: number) {
    return this.auditLogService.remove(id);
  }

  @Delete()
  @ApiOperation({ summary: '清理指定天数前的日志' })
  @ApiQuery({ name: 'days', description: '保留最近N天' })
  async clean(@Query('days') days: number) {
    return this.auditLogService.cleanBefore(days);
  }
}
