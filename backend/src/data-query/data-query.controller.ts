import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
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
    @Query() params: Record<string, string>,
  ) {
    const { page: pageStr = 1, pageSize: pageSizeStr = 20, ...queryParams } = params;
    const page = Number(pageStr);
    const pageSize = Number(pageSizeStr);

    // 校验分页参数合法性
    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestException('页码必须为正整数');
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 10000) {
      throw new BadRequestException('每页条数必须为 1~10000 的整数');
    }

    return this.dataQueryService.queryByReportCode(
      reportCode,
      queryParams,
      page,
      pageSize,
    );
  }
}