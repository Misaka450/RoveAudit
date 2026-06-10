import { Controller, Get, Query, Param, Res, Req, UnauthorizedException, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { DownloadService } from './download.service';
import { Permission } from '../common/decorators/permission.decorator';

/**
 * 下载控制器
 * 修复：使用 @SkipThrottle 跳过全局限流，下载是用户主动操作
 *      不会因为爬虫等异常被频繁请求（且已要求登录+权限）
 */
@ApiTags('下载')
@SkipThrottle()
@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get('excel')
  @Permission('report:download')
  @ApiOperation({ summary: '下载 Excel 文件' })
  @ApiQuery({ name: 'reportCode', description: '清单编码' })
  async downloadExcel(@Query() params: Record<string, any>, @Req() req: any, @Res() res: Response) {
    const { reportCode, queryParams } = this.parseDownloadParams(params, req);
    await this.downloadService.downloadExcel(reportCode, queryParams, req.user.userId, req.user.username, res);
  }

  @Get('csv')
  @Permission('report:download')
  @ApiOperation({ summary: '下载 CSV 文件' })
  @ApiQuery({ name: 'reportCode', description: '清单编码' })
  async downloadCsv(@Query() params: Record<string, any>, @Req() req: any, @Res() res: Response) {
    const { reportCode, queryParams } = this.parseDownloadParams(params, req);
    await this.downloadService.downloadCsv(reportCode, queryParams, req.user.userId, req.user.username, res);
  }

  @Get('stats')
  @Permission('report:view')
  @ApiOperation({ summary: '下载统计' })
  async getStats() {
    return this.downloadService.getStats();
  }

  @Get('logs')
  @Permission('report:view')
  @ApiOperation({ summary: '查询下载日志' })
  async getLogs(@Query('page') page?: number, @Query('pageSize') pageSize?: number) {
    return this.downloadService.findLogs(page ? +page : 1, pageSize ? +pageSize : 20);
  }

  @Delete('logs/:id')
  @Permission('report:view')
  @ApiOperation({ summary: '删除下载日志' })
  async removeLog(@Param('id') id: number) {
    return this.downloadService.remove(id);
  }

  private parseDownloadParams(params: Record<string, any>, req: any) {
    const { reportCode, filters, startDate, endDate, ...rest } = params;
    if (!req.user) throw new UnauthorizedException('请先登录');
    const queryParams: Record<string, any> = { ...rest };
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;
    if (filters) { try { Object.assign(queryParams, JSON.parse(filters)); } catch {} }
    return { reportCode, queryParams };
  }
}
