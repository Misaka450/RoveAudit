import { Injectable, BadRequestException } from '@nestjs/common';
import { DorisService } from './doris.service';
import { ReportService } from '../report/report.service';

/**
 * 数据查询服务 - 根据清单配置执行 Doris 查询
 */
@Injectable()
export class DataQueryService {
  constructor(
    private dorisService: DorisService,
    private reportService: ReportService,
  ) {}

  /**
   * 根据清单编码查询数据（分页 + 字段筛选）
   * @param reportCode - 清单编码
   * @param params - 查询参数（page, pageSize, filters, startDate, endDate）
   */
  async queryByReportCode(
    reportCode: string,
    params: Record<string, any> = {},
    page: number = 1,
    pageSize: number = 20,
  ) {
    // 1. 获取清单配置（含 SQL 模板）
    const report = await this.reportService.findByCode(reportCode);

    // 2. 处理 SQL 模板（替换参数占位符）
    let sql = report.sqlContent;
    for (const key of Object.keys(params)) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '' && key !== 'filters') {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        sql = sql.replace(regex, this.escapeValue(value));
      }
    }

    // 3. 应用字段筛选（filters: { column: value }）
    if (params.filters && typeof params.filters === 'object') {
      for (const [column, value] of Object.entries(params.filters)) {
        if (value !== undefined && value !== null && value !== '') {
          // 安全检查：列名只允许字母、数字、下划线
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
            continue;
          }
          const escapedValue = String(value).replace(/'/g, "''").replace(/\\/g, '\\\\');
          sql += ` AND ${column} LIKE '%${escapedValue}%'`;
        }
      }
    }

    // 4. 安全检查：只允许 SELECT 查询
    const trimmedSql = sql.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT')) {
      throw new BadRequestException('只允许执行 SELECT 查询');
    }

    // 5. 获取总条数
    const total = await this.dorisService.count(sql);

    // 6. 分页查询（Doris/MySQL 语法：LIMIT offset, count）
    const offset = (page - 1) * pageSize;
    const paginatedSql = `${sql} LIMIT ${offset}, ${pageSize}`;
    const data = await this.dorisService.query(paginatedSql);

    return {
      list: data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 执行自定义 SQL 查询（用于图表分析）
   */
  async executeQuery(sql: string) {
    const trimmedSql = sql.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT')) {
      throw new BadRequestException('只允许执行 SELECT 查询');
    }
    return this.dorisService.query(sql);
  }

  /**
   * 对 SQL 中的值进行安全转义（防 SQL 注入）
   */
  private escapeValue(value: any): string {
    if (typeof value === 'number') {
      return String(value);
    }
    const escaped = String(value).replace(/'/g, "''").replace(/\\/g, '\\\\');
    return `'${escaped}'`;
  }
}
