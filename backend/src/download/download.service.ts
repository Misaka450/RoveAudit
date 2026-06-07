import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { DataQueryService } from '../data-query/data-query.service';
import { ReportService } from '../report/report.service';
import { ReportColumnService } from '../report/report-column.service';
import { Report } from '../report/entities/report.entity';
import { DownloadLog } from './entities/download-log.entity';

/**
 * 下载服务 - 支持 Excel 和 CSV 导出
 * 优化：分批查询避免内存溢出，公共逻辑抽取到私有方法
 */
@Injectable()
export class DownloadService {
  // 每次分批查询的行数，避免一次加载过多数据到内存
  private readonly BATCH_SIZE = 5000;

  constructor(
    private dataQueryService: DataQueryService,
    private reportService: ReportService,
    private reportColumnService: ReportColumnService,
    @InjectRepository(DownloadLog)
    private downloadLogRepository: Repository<DownloadLog>,
  ) {}

  /**
   * 获取下载元数据 - 仅加载第 1 页第一行以获取结构，不加载全部数据到内存
   */
  private async fetchMetadata(
    reportCode: string,
    params: Record<string, any>,
  ): Promise<{
    report: Report;
    total: number;
    columns: string[];
    columnMap: Map<string, string>;
  }> {
    const report = await this.reportService.findByCode(reportCode);
    if (!report.enableDownload) {
      throw new BadRequestException('该清单不允许下载');
    }

    // 先获取第一页的 1 条数据，同时获得总条数和结构
    const firstPage = await this.dataQueryService.queryByReportCode(
      reportCode, params, 1, 1,
    );
    const total = firstPage.total;
    if (total === 0) {
      throw new BadRequestException('没有可下载的数据');
    }

    // 获取字段配置，如果有配置则使用中文列名
    const columnConfigs = await this.reportColumnService.findByReportCode(reportCode);
    const columnMap = new Map(columnConfigs.map((c) => [c.columnName, c.columnLabel]));

    const columns = firstPage.list.length > 0 ? Object.keys(firstPage.list[0]) : [];

    return { report, total, columns, columnMap };
  }

  /**
   * 下载清单数据为 Excel 文件（流式写入，优化内存占用）
   */
  async downloadExcel(
    reportCode: string,
    params: Record<string, any>,
    userId: number,
    username: string,
    res: any, // Express.Response
  ): Promise<void> {
    const { report, total, columns, columnMap } = await this.fetchMetadata(reportCode, params);
    const fileName = `${report.reportName}_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);

    // 使用 ExcelJS WorkbookWriter 流式写入 res
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true,
      useSharedStrings: true,
    });
    const sheet = workbook.addWorksheet(report.reportName);

    // 使用字段配置的中文列名作为表头
    sheet.columns = columns.map((col) => ({
      header: columnMap.get(col) || col,
      key: col,
      width: 20,
    }));

    // 设置表头样式
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.commit();

    // 分批加载并流式写入数据
    const totalPages = Math.ceil(total / this.BATCH_SIZE);
    for (let p = 1; p <= totalPages; p++) {
      const pageData = await this.dataQueryService.queryByReportCode(
        reportCode, params, p, this.BATCH_SIZE,
      );
      for (const row of pageData.list) {
        sheet.addRow(row).commit();
      }
    }

    await sheet.commit();
    await workbook.commit();

    // 记录下载日志
    await this.saveLog(userId, username, report, fileName, 'excel', total);
  }

  /**
   * 下载清单数据为 CSV 文件（流式写入，优化内存占用）
   */
  async downloadCsv(
    reportCode: string,
    params: Record<string, any>,
    userId: number,
    username: string,
    res: any, // Express.Response
  ): Promise<void> {
    const { report, total, columns, columnMap } = await this.fetchMetadata(reportCode, params);
    const fileName = `${report.reportName}_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);

    // 写入 BOM 防乱码
    res.write('\uFEFF');

    // 写入表头
    const headers = columns.map((col) => columnMap.get(col) || col);
    res.write(headers.join(',') + '\n');

    // CSV 行转义函数
    const toCsvRow = (row: any) =>
      columns.map((col) => {
        const val = String(row[col] ?? '');
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(',');

    // 分批加载并写入
    const totalPages = Math.ceil(total / this.BATCH_SIZE);
    for (let p = 1; p <= totalPages; p++) {
      const pageData = await this.dataQueryService.queryByReportCode(
        reportCode, params, p, this.BATCH_SIZE,
      );
      for (const row of pageData.list) {
        res.write(toCsvRow(row) + '\n');
      }
    }

    res.end();

    await this.saveLog(userId, username, report, fileName, 'csv', total);
  }

  /**
   * 获取下载统计（今日下载量、本月下载量、热门清单排行）
   */
  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 今日下载量
    const todayCount = await this.downloadLogRepository.count({
      where: { downloadTime: Between(todayStart, now) },
    });

    // 本月下载量
    const monthCount = await this.downloadLogRepository.count({
      where: { downloadTime: Between(monthStart, now) },
    });

    // 热门清单排行（按下载次数分组统计）
    const topReports = await this.downloadLogRepository
      .createQueryBuilder('log')
      .select('log.report_name', 'reportName')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.report_name')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return { todayCount, monthCount, topReports: topReports.map(r => ({ reportName: r.reportName, downloadCount: parseInt(r.count, 10) })) };
  }

  /** 保存下载日志 */
  private async saveLog(
    userId: number,
    username: string,
    report: Report,
    fileName: string,
    fileType: string,
    dataCount: number,
  ) {
    await this.downloadLogRepository.save({
      userId, username,
      reportId: report.id,
      reportName: report.reportName,
      fileName, fileType, dataCount,
    });
  }

  /** 查询下载日志（支持分页） */
  async findAll(keyword?: string, page?: number, pageSize?: number) {
    const where = keyword
      ? [
          { username: Like(`%${keyword}%`) },
          { reportName: Like(`%${keyword}%`) },
          { fileName: Like(`%${keyword}%`) },
        ]
      : {};

    if (page && pageSize) {
      const skip = (page - 1) * pageSize;
      const [list, total] = await this.downloadLogRepository.findAndCount({
        where,
        order: { downloadTime: 'DESC' },
        skip,
        take: pageSize,
      });
      return { list, total };
    }

    return this.downloadLogRepository.find({
      where,
      order: { downloadTime: 'DESC' },
    });
  }

  /** 删除下载日志 */
  async remove(id: number) {
    return this.downloadLogRepository.delete(id);
  }
}