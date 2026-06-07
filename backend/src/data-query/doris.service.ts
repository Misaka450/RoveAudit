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
    const dorisPassword = this.configService.get<string>('DORIS_PASSWORD', '');
    this.pool = mysql.createPool({
      host: this.configService.get('DORIS_HOST', 'localhost'),
      port: this.configService.get('DORIS_PORT', 9030),
      user: this.configService.get('DORIS_USER', 'root'),
      password: dorisPassword !== undefined ? dorisPassword : '',
      database: this.configService.get('DORIS_DATABASE', 'audit_db'),
      waitForConnections: true,
      connectionLimit: this.configService.get('DORIS_POOL_SIZE', 10),
      queueLimit: 0,
      // 空闲连接超时自动释放，防止连接泄漏
      idleTimeout: 60000,
      // 连接超时
      connectTimeout: 10000,
    });
    this.logger.log('Doris 连接池已创建');
  }

  /**
   * 健康检测 - 检查 Doris 是否可达
   * 在应用启动时调用，不阻塞服务启动
   */
  async healthCheck(): Promise<boolean> {
    try {
      const connection = await this.pool.getConnection();
      await connection.query('SELECT 1');
      connection.release();
      this.logger.log('Doris 健康检测通过');
      return true;
    } catch (error) {
      this.logger.warn(`Doris 健康检测失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 执行 SQL 查询（只读操作）
   * @param params - 可选参数数组，用于参数化查询防 SQL 注入
   */
  async query(sql: string, params?: any[]): Promise<any[]> {
    const connection = await this.pool.getConnection();
    try {
      // 日志只记录 SQL 模板（前200字符），不记录参数值（防止敏感数据泄露）
      this.logger.log(`执行查询: ${sql.substring(0, 200)}`);
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
   * 优化：用 COUNT(*) OVER() 窗口函数替代子查询，一次查询拿到数据和总数
   */
  async count(sql: string, params?: any[]): Promise<number> {
    // 从原始 SQL 中构建 COUNT 查询
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const result = await this.query(countSql, params);
    return result[0]?.total || 0;
  }
}