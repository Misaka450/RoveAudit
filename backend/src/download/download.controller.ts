import { Controller, Get, Post, Delete, Query, Param, Res, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { DownloadService } from './download.service';
import { Public } from '../common/decorators/public.decorator';
import { Permission } from '../common/decorators/permission.decorator';

/**
 * 下载控制器 - 处理 Excel / CSV 文件下载
 * 下载通过 window.open() 触发，无法设置 Authorization 头，
 * 所以使用 @Public() 标记 + 手动从 query 参数中验证 token
 */
@ApiTags('下载')
@Controller('download')
export class DownloadController {
  constructor(
    private readonly downloadService: DownloadService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 从请求中提取并验证用户身份（支持 header 和 query 两种方式）
   */
  private extractUser(req: any): any {
    // 优先从 JWT 守卫挂载的 req.user 获取
    if (req.user) return req.user;

    // 兼容 window.open 场景：从 query 参数获取 token
    const token = req.query?.token;
    if (token) {
      try {
        return this.jwtService.verify(token);
      } catch {
        throw new UnauthorizedException('登录已过期，请重新登录');
      }
    }

    throw new UnauthorizedException('请先登录');
  }

  /**
   * 下载 Excel 文件
   */
  @Get('excel')
  @Public()
  @ApiOperation({ summary: '下载 Excel 文件' })
  @ApiQuery({ name: 'reportCode', description: '清单编码' })
  async downloadExcel(
    @Query() params: Record<string, any>,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { reportCode, token, filters, startDate, endDate, ...rest } = params;
    const user = this.extractUser(req);
    const queryParams: Record<string, any> = { ...rest };
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;
    if (filters) {
      try { Object.assign(queryParams, JSON.parse(filters)); } catch {}
    }

    const { buffer, fileName } = await this.downloadService.downloadExcel(
      reportCode, queryParams, user.userId, user.username,
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
    res.send(buffer);
  }

  @Get('csv')
  @Public()
  @ApiOperation({ summary: '下载 CSV 文件' })
  @ApiQuery({ name: 'reportCode', description: '清单编码' })
  async downloadCsv(
    @Query() params: Record<string, any>,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { reportCode, token, filters, startDate, endDate, ...rest } = params;
    const user = this.extractUser(req);
    const queryParams: Record<string, any> = { ...rest };
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;
    if (filters) {
      try { Object.assign(queryParams, JSON.parse(filters)); } catch {}
    }

    const { buffer, fileName } = await this.downloadService.downloadCsv(
      reportCode, queryParams, user.userId, user.username,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
    res.send(buffer);
  }

  /** 查询下载日志 */
  @Get('logs')
  @ApiOperation({ summary: '查询下载日志' })
  async getLogs(@Query('keyword') keyword?: string) {
    return this.downloadService.findAll(keyword);
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
  @ApiOperation({ summary: '删除下载日志' })
  async removeLog(@Param('id') id: number) {
    return this.downloadService.remove(id);
  }
}