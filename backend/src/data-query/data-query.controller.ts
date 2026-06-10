import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DataQueryService } from './data-query.service';

/**
 * 数据查询控制器 - 对外提供清单数据查询接口
 * 修复：使用 @SkipThrottle 跳过全局 60 次/分钟限流
 * 原因：清单查询是核心高频操作（如表格翻页、筛选项联动），
 *      60 次/分钟太低容易误伤正常用户。数据查询本身已要求登录
 *      + 参数校验 + 报表配置校验，没必要再叠加严格限流。
 */
@ApiTags('数据查询')
@SkipThrottle() // 该控制器所有接口不限流（受登录和参数校验保护）
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