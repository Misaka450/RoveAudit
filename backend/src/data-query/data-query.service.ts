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
    const queryParams: any[] = [];
    for (const key of Object.keys(params)) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '' && key !== 'filters') {
        // 校验参数名：只允许字母、数字、下划线，防止恶意构造的 key
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
          continue;
        }
        // 校验参数值：过滤 SQL 注入特征（仅限字符串类型）
        if (typeof value === 'string' && /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|EXEC|UNION\s+SELECT)/i.test(value)) {
          throw new BadRequestException(`参数 "${key}" 包含非法内容`);
        }
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
        // 使用 ? 占位符替代直接嵌入值
        if (regex.test(sql)) {
          sql = sql.replace(regex, '?');
          queryParams.push(value);
          // 重置正则 lastIndex
          regex.lastIndex = 0;
        }
      }
    }

    // 3. 应用字段筛选（filters: { column: value }）— 使用参数化查询防 SQL 注入
    if (params.filters && typeof params.filters === 'object') {
      for (const [column, value] of Object.entries(params.filters)) {
        if (value !== undefined && value !== null && value !== '') {
          // 安全检查：列名只允许字母、数字、下划线
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
            continue;
          }
          sql += ` AND ${column} LIKE ?`;
          queryParams.push(`%${value}%`);
        }
      }
    }

    // 4. 安全检查：只允许 SELECT 查询
    const trimmedSql = sql.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT')) {
      throw new BadRequestException('只允许执行 SELECT 查询');
    }

    // 5. 获取总条数（传递参数）
    const total = await this.dorisService.count(sql, queryParams);

    // 6. 分页查询（Doris/MySQL 语法：LIMIT offset, count）
    const offset = (page - 1) * pageSize;
    const paginatedSql = `${sql} LIMIT ?, ?`;
    const paginatedParams = [...queryParams, offset, pageSize];
    const data = await this.dorisService.query(paginatedSql, paginatedParams);

    return {
      list: data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
