import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /** 记录操作日志 */
  async log(data: Partial<AuditLog>) {
    return this.auditLogRepository.save(data);
  }

  /** 查询日志列表（分页） */
  async findAll(params: { keyword?: string; page?: number; pageSize?: number }) {
    const { keyword, page = 1, pageSize = 20 } = params;
    const where: any[] = [];
    if (keyword) {
      where.push({ username: Like(`%${keyword}%`) });
      where.push({ action: Like(`%${keyword}%`) });
    }

    const [list, total] = await this.auditLogRepository.findAndCount({
      where: where.length > 0 ? where : undefined,
      order: { createTime: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total, page, pageSize };
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
}
