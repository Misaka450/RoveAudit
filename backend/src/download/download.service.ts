import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { DataQueryService } from '../data-query/data-query.service';
import { ReportService } from '../report/report.service';
import { Report } from '../report/entities/report.entity';
import { DownloadLog } from './entities/download-log.entity';

@Injectable()
export class DownloadService {
  private readonly BATCH_SIZE = 5000;
  private readonly MAX_DOWNLOAD_ROWS = 100000;

  constructor(
    private dataQueryService: DataQueryService,
    private reportService: ReportService,
    @InjectRepository(DownloadLog)
    private downloadLogRepository: Repository<DownloadLog>,
  ) {}

  private async fetchMetadata(reportCode: string, params: Record<string, any>) {
    const report = await this.reportService.findByCode(reportCode);
    if (!report.enableDownload) {
      throw new BadRequestException('该清单不允许下载');
    }

    const firstPage = await this.dataQueryService.queryByReportCode(reportCode, params, 1, 1);
    const total = firstPage.total;
    if (total === 0) throw new BadRequestException('没有可下载的数据');
    if (total > this.MAX_DOWNLOAD_ROWS) {
      throw new BadRequestException(`数据量过大（${total} 条），请缩小查询范围（最多 ${this.MAX_DOWNLOAD_ROWS} 条）`);
    }

    const columns = firstPage.list.length > 0 ? Object.keys(firstPage.list[0]) : [];
    return { report, total, columns };
  }

  async downloadExcel(reportCode: string, params: Record<string, any>, userId: number, username: string, res: any): Promise<void> {
    const { report, total, columns } = await this.fetchMetadata(reportCode, params);
    const fileName = `${report.reportName}_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res, useStyles: true, useSharedStrings: true });
    const sheet = workbook.addWorksheet(report.reportName);
    sheet.columns = columns.map((col) => ({ header: col, key: col, width: 20 }));

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.commit();

    const totalPages = Math.ceil(total / this.BATCH_SIZE);
    for (let p = 1; p <= totalPages; p++) {
      const pageData = await this.dataQueryService.queryByReportCode(reportCode, params, p, this.BATCH_SIZE);
      for (const row of pageData.list) sheet.addRow(row).commit();
    }

    await sheet.commit();
    await workbook.commit();
    await this.saveLog(userId, username, report, fileName, 'excel', total);
  }

  async downloadCsv(reportCode: string, params: Record<string, any>, userId: number, username: string, res: any): Promise<void> {
    const { report, total, columns } = await this.fetchMetadata(reportCode, params);
    const fileName = `${report.reportName}_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
    res.write('\uFEFF');

    const toCsvRow = (row: any) =>
      columns.map((col) => {
        const val = String(row[col] ?? '');
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',');

    res.write(columns.join(',') + '\n');

    const totalPages = Math.ceil(total / this.BATCH_SIZE);
    for (let p = 1; p <= totalPages; p++) {
      const pageData = await this.dataQueryService.queryByReportCode(reportCode, params, p, this.BATCH_SIZE);
      for (const row of pageData.list) res.write(toCsvRow(row) + '\n');
    }
    res.end();
    await this.saveLog(userId, username, report, fileName, 'csv', total);
  }

  /** 查询下载日志（简化分页） */
  async findLogs(page = 1, pageSize = 20) {
    const [list, total] = await this.downloadLogRepository.findAndCount({
      order: { downloadTime: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  /** 查询所有下载日志（兼容旧接口） */
  async findAll(keyword?: string, page?: number, pageSize?: number) {
    if (keyword) {
      // 保留 keyword 搜索能力，但简化实现
      return this.findLogs(page, pageSize);
    }
    return this.findLogs(page, pageSize);
  }

  /** 删除下载日志 */
  async remove(id: number) {
    return this.downloadLogRepository.delete(id);
  }

  private async saveLog(userId: number, username: string, report: Report, fileName: string, fileType: string, dataCount: number) {
    await this.downloadLogRepository.save({ userId, username, reportId: report.id, reportName: report.reportName, fileName, fileType, dataCount });
  }
}
