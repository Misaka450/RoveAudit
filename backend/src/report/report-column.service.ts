import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportColumn } from './entities/report-column.entity';

/**
 * 清单字段配置服务 - 管理每个清单的列展示属性
 */
@Injectable()
export class ReportColumnService {
  constructor(
    @InjectRepository(ReportColumn)
    private columnRepository: Repository<ReportColumn>,
  ) {}

  /** 根据清单编码获取字段配置列表（按排序号排列） */
  async findByReportCode(reportCode: string): Promise<ReportColumn[]> {
    return this.columnRepository.find({
      where: { reportCode },
      order: { sortOrder: 'ASC' },
    });
  }

  /** 批量保存字段配置（先删后插） */
  async saveColumns(reportCode: string, columns: Partial<ReportColumn>[]) {
    // 删除已有的字段配置
    await this.columnRepository.delete({ reportCode });
    // 批量插入新配置
    const entities = columns.map((col) =>
      this.columnRepository.create({ ...col, reportCode }),
    );
    return this.columnRepository.save(entities);
  }

  /** 更新单条字段配置 */
  async update(id: number, data: Partial<ReportColumn>) {
    await this.columnRepository.update(id, data);
    return this.columnRepository.findOne({ where: { id } });
  }
}