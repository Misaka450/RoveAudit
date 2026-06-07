import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportChart } from './entities/report-chart.entity';

/**
 * 清单图表配置服务 - 管理每个清单的图表配置
 */
@Injectable()
export class ReportChartService {
  constructor(
    @InjectRepository(ReportChart)
    private chartRepository: Repository<ReportChart>,
  ) {}

  /** 根据清单编码获取启用的图表配置列表 */
  async findByReportCode(reportCode: string): Promise<ReportChart[]> {
    return this.chartRepository.find({
      where: { reportCode, status: 1 },
      order: { sortOrder: 'ASC' },
    });
  }

  /** 获取所有清单的图表配置（用于统计分析中心） */
  async findAll(): Promise<ReportChart[]> {
    return this.chartRepository.find({
      where: { status: 1 },
      order: { sortOrder: 'ASC' },
    });
  }

  /** 创建图表配置 */
  async create(data: Partial<ReportChart>) {
    const chart = this.chartRepository.create(data);
    return this.chartRepository.save(chart);
  }

  /** 更新图表配置 */
  async update(id: number, data: Partial<ReportChart>) {
    await this.chartRepository.update(id, data);
    return this.chartRepository.findOne({ where: { id } });
  }

  /** 删除图表配置（软删除，改为禁用状态） */
  async remove(id: number) {
    return this.chartRepository.update(id, { status: 0 });
  }
}