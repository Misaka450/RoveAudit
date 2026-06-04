import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DataQueryService } from './data-query.service';

/**
 * 数据查询控制器 - 对外提供清单数据查询接口
 */
@ApiTags('数据查询')
@Controller('data-query')
export class DataQueryController {
  constructor(private readonly dataQueryService: DataQueryService) {}

  /**
   * 根据清单编码查询数据（分页）
   * 示例：GET /api/data-query/report/user_develop?date=2024-01&province=广东&page=1&pageSize=20
   */
  @Get('report/:reportCode')
  @ApiOperation({ summary: '根据清单编码查询数据（分页）' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数' })
  queryByReportCode(
    @Param('reportCode') reportCode: string,
    @Query() params: Record<string, any>,
  ) {
    const { page = 1, pageSize = 20, ...queryParams } = params;
    return this.dataQueryService.queryByReportCode(
      reportCode,
      queryParams,
      +page,
      +pageSize,
    );
  }

  /**
   * 执行自定义 SQL（用于图表分析等场景）
   */
  @Post('execute')
  @ApiOperation({ summary: '执行自定义 SQL 查询' })
  executeQuery(@Body('sql') sql: string) {
    return this.dataQueryService.executeQuery(sql);
  }
}