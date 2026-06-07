import { Controller, Get, Delete, Query, Param, Res, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { DownloadService } from './download.service';
import { Permission } from '../common/decorators/permission.decorator';

/**
 * 下载控制器 - 处理 Excel / CSV 文件下载
 */
@ApiTags('下载')
@Controller('download')
export class DownloadController {
  constructor(
    private readonly downloadService: DownloadService,
  ) {}

  /**
   * 下载 Excel 文件
   */
  @Get('excel')
  @Permission('report:download')
  @ApiOperation({ summary: '下载 Excel 文件' })
  @ApiQuery({ name: 'reportCode', description: '清单编码' })
  async downloadExcel(
    @Query() params: Record<string, any>,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { reportCode, queryParams } = this.parseDownloadParams(params, req);
    await this.downloadService.downloadExcel(
      reportCode, queryParams, req.user.userId, req.user.username, res,
    );
  }

  @Get('csv')
  @Permission('report:download')
  @ApiOperation({ summary: '下载 CSV 文件' })
  @ApiQuery({ name: 'reportCode', description: '清单编码' })
  async downloadCsv(
    @Query() params: Record<string, any>,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { reportCode, queryParams } = this.parseDownloadParams(params, req);
    await this.downloadService.downloadCsv(
      reportCode, queryParams, req.user.userId, req.user.username, res,
    );
  }

  /** 提取下载参数公共逻辑 */
  private parseDownloadParams(params: Record<string, any>, req: any) {
    const { reportCode, filters, startDate, endDate, ...rest } = params;
    if (!req.user) throw new UnauthorizedException('请先登录');
    const queryParams: Record<string, any> = { ...rest };
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;
    if (filters) {
      try { Object.assign(queryParams, JSON.parse(filters)); } catch {}
    }
    return { reportCode, queryParams };
  }

  /** 查询下载日志 */
  @Get('logs')
  @Permission('report:view')
  @ApiOperation({ summary: '查询下载日志' })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数' })
  async getLogs(
    @Query('keyword') keyword?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.downloadService.findAll(keyword, page ? +page : undefined, pageSize ? +pageSize : undefined);
  }

  /** 获取下载统计 */
  @Get('stats')
  @Permission('report:view')
  @ApiOperation({ summary: '获取下载统计（今日/本月下载量、热门排行）' })
  async getStats() {
    return this.downloadService.getStats();
  }

  /** 删除下载日志 */
  @Delete('logs/:id')
  @Permission('report:view')
  @ApiOperation({ summary: '删除下载日志' })
  async removeLog(@Param('id') id: number) {
    return this.downloadService.remove(id);
  }
}