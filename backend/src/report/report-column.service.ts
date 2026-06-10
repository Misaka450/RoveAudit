import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ReportColumn } from './entities/report-column.entity';

/**
 * 清单字段配置服务 - 管理每个清单的列展示属性
 */
@Injectable()
export class ReportColumnService {
  constructor(
    @InjectRepository(ReportColumn)
    private columnRepository: Repository<ReportColumn>,
    private dataSource: DataSource,
  ) {}

  /** 根据清单编码获取字段配置列表（按排序号排列） */
  async findByReportCode(reportCode: string): Promise<ReportColumn[]> {
    return this.columnRepository.find({
      where: { reportCode },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 批量保存字段配置（先删后插）
   * 关键修复：用事务包裹"删+插"两个操作，保证原子性
   * 防止删除成功但插入失败时清空配置表导致前端拿不到任何列定义
   */
  async saveColumns(reportCode: string, columns: Partial<ReportColumn>[]) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(ReportColumn);
      // 删除已有的字段配置
      await repo.delete({ reportCode });
      // 批量插入新配置
      const entities = columns.map((col) =>
        repo.create({ ...col, reportCode }),
      );
      return repo.save(entities);
    });
  }

  /** 更新单条字段配置 */
  async update(id: number, data: Partial<ReportColumn>) {
    await this.columnRepository.update(id, data);
    return this.columnRepository.findOne({ where: { id } });
  }
}