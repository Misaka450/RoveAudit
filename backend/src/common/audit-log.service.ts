import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditLog } from './entities/audit-log.entity';

/** TypeORM FindMany 选项类型（用于替代 any） */
type FindAllOptions = {
  keyword?: string;
  page?: number;
  pageSize?: number;
};

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /** 记录操作日志 */
  async log(data: Partial<AuditLog>) {
    return this.auditLogRepository.save(data);
  }

  /** 查询日志列表（分页，默认每页20条，最多100条） */
  async findAll(params: { keyword?: string; page?: number; pageSize?: number }) {
    const { keyword, page = 1, pageSize = 20 } = params;
    const effectivePageSize = Math.min(pageSize, 100);
    const where: any[] = [];
    if (keyword) {
      // 转义 LIKE 通配符，防止用户输入的 % 和 _ 被当作通配符
      const escaped = keyword.replace(/[%_]/g, '\\$&');
      where.push({ username: Like(`%${escaped}%`) });
      where.push({ action: Like(`%${escaped}%`) });
    }

    const [list, total] = await this.auditLogRepository.findAndCount({
      where: where.length > 0 ? where : undefined,
      order: { createTime: 'DESC' },
      skip: (page - 1) * effectivePageSize,
      take: effectivePageSize,
    });

    return { list, total, page, pageSize: effectivePageSize };
  }

  /** 删除单条日志 */
  async remove(id: number) {
    return this.auditLogRepository.delete(id);
  }

  /** 清空指定天数之前的日志 */
  async cleanBefore(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('create_time < :date', { date })
      .execute();
  }

  /**
   * 定时清理：每天凌晨 2 点清理 90 天前的审计日志
   */
  @Cron('0 2 * * *')
  async scheduledCleanup() {
    try {
      const deleted = await this.cleanBefore(90);
      if (deleted.affected && deleted.affected > 0) {
        this.logger.log(`自动清理了 ${deleted.affected} 条过期审计日志`);
      }
    } catch (error) {
      this.logger.error(`定时清理审计日志失败: ${error.message}`);
    }
  }
}
