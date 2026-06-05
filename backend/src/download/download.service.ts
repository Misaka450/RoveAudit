import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { DataQueryService } from '../data-query/data-query.service';
import { ReportService } from '../report/report.service';
import { DownloadLog } from './entities/download-log.entity';

/**
 * 下载服务 - 支持 Excel 和 CSV 导出
 */
@Injectable()
export class DownloadService {
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

    // 获取全部数据（不分页，最多10万条）
    const result = await this.dataQueryService.queryByReportCode(
      reportCode,
      params,
      1,
      100000,
    );

    const data = result.list as any[];
    if (data.length === 0) {
      throw new BadRequestException('没有可下载的数据');
    }

    // 创建 Excel 工作簿
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(report.reportName);

    // 动态生成表头（从数据中提取列名）
    const columns = Object.keys(data[0]);
    sheet.columns = columns.map((col) => ({
      header: col,
      key: col,
      width: 20,
    }));

    // 设置表头样式
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // 添加数据行
    sheet.addRows(data);

    // 生成 Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 记录下载日志
    const fileName = `${report.reportName}_${Date.now()}.xlsx`;
    await this.downloadLogRepository.save({
      userId,
      username,
      reportId: report.id,
      reportName: report.reportName,
      fileName,
      fileType: 'excel',
      dataCount: data.length,
    });

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

    const result = await this.dataQueryService.queryByReportCode(
      reportCode,
      params,
      1,
      100000,
    );

    const data = result.list as any[];
    if (data.length === 0) {
      throw new BadRequestException('没有可下载的数据');
    }

    // 生成 CSV 内容
    const columns = Object.keys(data[0]);
    const csvRows: string[] = [];

    // 表头
    csvRows.push(columns.join(','));

    // 数据行（处理包含逗号和换行的字段）
    for (const row of data) {
      const values = columns.map((col) => {
        const val = String(row[col] ?? '');
        // 如果字段包含逗号、引号或换行，用双引号包裹
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM 头确保中文不乱码
    const buffer = Buffer.from(csvContent, 'utf-8');

    // 记录下载日志
    const fileName = `${report.reportName}_${Date.now()}.csv`;
    await this.downloadLogRepository.save({
      userId,
      username,
      reportId: report.id,
      reportName: report.reportName,
      fileName,
      fileType: 'csv',
      dataCount: data.length,
    });

    return { buffer, fileName };
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