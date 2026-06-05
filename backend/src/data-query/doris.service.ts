import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';

/**
 * Doris 业务数据库连接服务
 * Doris 兼容 MySQL 协议，所以用 mysql2 驱动连接
 */
@Injectable()
export class DorisService {
  private pool: mysql.Pool;
  private readonly logger = new Logger(DorisService.name);

  constructor(private configService: ConfigService) {
    // 创建 Doris 连接池
    const dorisPassword = this.configService.get('DORIS_PASSWORD', '');
    this.pool = mysql.createPool({
      host: this.configService.get('DORIS_HOST', 'localhost'),
      port: this.configService.get('DORIS_PORT', 9030),
      user: this.configService.get('DORIS_USER', 'root'),
      password: dorisPassword || undefined,
      database: this.configService.get('DORIS_DATABASE', 'audit_db'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    this.logger.log('Doris 连接池已创建');
  }

  /**
   * 执行 SQL 查询（只读操作）
   */
  async query(sql: string, params?: any[]): Promise<any[]> {
    const connection = await this.pool.getConnection();
    try {
      this.logger.log(`执行查询: ${sql.substring(0, 200)}...`);
      const [rows] = await connection.query(sql, params);
      return rows as any[];
    } catch (error) {
      this.logger.error(`查询失败: ${error.message}`);
      throw error;
    } finally {
      connection.release(); // 归还连接到池
    }
  }

  /**
   * 执行计数查询（获取总条数）
   */
  async count(sql: string): Promise<number> {
    // 从原始 SQL 中构建 COUNT 查询
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const result = await this.query(countSql);
    return result[0]?.total || 0;
  }
}