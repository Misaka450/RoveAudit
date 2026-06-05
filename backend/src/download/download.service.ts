import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { DataQueryService } from '../data-query/data-query.service';
import { ReportService } from '../report/report.service';
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
    @InjectRepository(DownloadLog)
    private downloadLogRepository: Repository<DownloadLog>,
  ) {}

  /**
   * 下载清单数据为 Excel 文件
   */
  async downloadExcel(
    reportCode: string,
    params: Record<string, any>,
    userId: number,
    username: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const report = await this.reportService.findByCode(reportCode);
    if (!report.enableDownload) {
      throw new BadRequestException('该清单不允许下载');
    }

    // 先获取第一页数据，同时获得总条数
    const firstPage = await this.dataQueryService.queryByReportCode(
      reportCode, params, 1, this.BATCH_SIZE,
    );
    const total = firstPage.total;
    if (total === 0) {
      throw new BadRequestException('没有可下载的数据');
    }

    // 创建 Excel 工作簿
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(report.reportName);

    // 从第一页数据提取表头
    const columns = Object.keys(firstPage.list[0]);
    sheet.columns = columns.map((col) => ({ header: col, key: col, width: 20 }));

    // 设置表头样式
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // 写入第一页数据
    sheet.addRows(firstPage.list);

    // 分批加载剩余数据并追加到表格
    const totalPages = Math.ceil(total / this.BATCH_SIZE);
    for (let p = 2; p <= totalPages; p++) {
      const pageData = await this.dataQueryService.queryByReportCode(
        reportCode, params, p, this.BATCH_SIZE,
      );
      sheet.addRows(pageData.list);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `${report.reportName}_${Date.now()}.xlsx`;

    // 记录下载日志
    await this.saveLog(userId, username, report, fileName, 'excel', total);

    return { buffer: Buffer.from(buffer), fileName };
  }

  /**
   * 下载清单数据为 CSV 文件
   */
  async downloadCsv(
    reportCode: string,
    params: Record<string, any>,
    userId: number,
    username: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const report = await this.reportService.findByCode(reportCode);
    if (!report.enableDownload) {
      throw new BadRequestException('该清单不允许下载');
    }

    // 分批获取数据，避免一次性加载过多
    const firstPage = await this.dataQueryService.queryByReportCode(
      reportCode, params, 1, this.BATCH_SIZE,
    );
    const total = firstPage.total;
    if (total === 0) {
      throw new BadRequestException('没有可下载的数据');
    }

    const columns = Object.keys(firstPage.list[0]);

    // 构建 CSV 内容（按行追加，避免一次性构建大字符串）
    const csvParts: string[] = [];

    // BOM + 表头
    csvParts.push('\uFEFF' + columns.join(','));

    // CSV 行转义
    const toCsvRow = (row: any) =>
      columns.map((col) => {
        const val = String(row[col] ?? '');
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(',');

    // 写入第一页
    for (const row of firstPage.list) {
      csvParts.push(toCsvRow(row));
    }

    // 分批加载剩余数据
    const totalPages = Math.ceil(total / this.BATCH_SIZE);
    for (let p = 2; p <= totalPages; p++) {
      const pageData = await this.dataQueryService.queryByReportCode(
        reportCode, params, p, this.BATCH_SIZE,
      );
      for (const row of pageData.list) {
        csvParts.push(toCsvRow(row));
      }
    }

    const buffer = Buffer.from(csvParts.join('\n'), 'utf-8');
    const fileName = `${report.reportName}_${Date.now()}.csv`;

    await this.saveLog(userId, username, report, fileName, 'csv', total);

    return { buffer, fileName };
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

  /** 查询下载日志 */
  async findAll(keyword?: string) {
    if (keyword) {
      return this.downloadLogRepository.find({
        where: [
          { username: Like(`%${keyword}%`) },
          { reportName: Like(`%${keyword}%`) },
          { fileName: Like(`%${keyword}%`) },
        ],
        order: { downloadTime: 'DESC' },
      });
    }
    return this.downloadLogRepository.find({
      order: { downloadTime: 'DESC' },
    });
  }

  /** 删除下载日志 */
  async remove(id: number) {
    return this.downloadLogRepository.delete(id);
  }
}