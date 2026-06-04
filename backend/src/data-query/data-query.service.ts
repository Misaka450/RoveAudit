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
   * 根据清单编码查询数据（分页）
   * @param reportCode - 清单编码
   * @param params - 查询参数（如：时间、省份、地市等）
   * @param page - 页码
   * @param pageSize - 每页条数
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
    // 支持两种参数占位符：{{paramName}} 和 ${paramName}
    for (const key of Object.keys(params)) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        // 替换 {{key}} 占位符
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        sql = sql.replace(regex, this.escapeValue(value));
        // 替换 ${key} 占位符
        const regex2 = new RegExp(`\\$\\{${key}\\}`, 'g');
        sql = sql.replace(regex2, this.escapeValue(value));
      }
    }

    // 3. 安全检查：只允许 SELECT 查询
    const trimmedSql = sql.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT')) {
      throw new BadRequestException('只允许执行 SELECT 查询');
    }

    // 4. 获取总条数
    const total = await this.dorisService.count(sql);

    // 5. 分页查询（PG 语法：LIMIT count OFFSET offset）
    const offset = (page - 1) * pageSize;
    const paginatedSql = `${sql} LIMIT ${pageSize} OFFSET ${offset}`;
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
    // 安全检查
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
    // 字符串类型：加单引号并转义特殊字符
    const escaped = String(value).replace(/'/g, "''").replace(/\\/g, '\\\\');
    return `'${escaped}'`;
  }
}