import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Report } from './entities/report.entity';

/**
 * 清单配置管理服务 - 配置化清单的核心
 * 新增清单只需在此插入一条配置，无需修改代码
 */
@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
  ) {}

  /**
   * 查询所有启用的清单（按分类和排序号排列）
   */
  async findAll(category?: string) {
    const where: any = { status: 1 };
    if (category) {
      where.category = category;
    }
    return this.reportRepository.find({
      where,
      order: { category: 'ASC', sortOrder: 'ASC' },
      select: ['id', 'reportName', 'reportCode', 'category', 'description', 'enableDownload', 'enableChart', 'sortOrder', 'updateTime'],
    });
  }

  /**
   * 查询所有清单（包括禁用，用于管理页面）
   */
  async findAllAdmin(keyword?: string) {
    const where: any = {};
    if (keyword) {
      return this.reportRepository.find({
        where: [
          { reportName: Like(`%${keyword}%`) },
          { reportCode: Like(`%${keyword}%`) },
        ],
        order: { createTime: 'DESC' },
      });
    }
    return this.reportRepository.find({ order: { createTime: 'DESC' } });
  }

  /**
   * 根据ID查询清单详情（含SQL内容）
   */
  async findOne(id: number) {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) throw new NotFoundException('清单不存在');
    return report;
  }

  /**
   * 根据编码查询清单（用于数据查询接口）
   */
  async findByCode(reportCode: string) {
    const report = await this.reportRepository.findOne({
      where: { reportCode, status: 1 },
    });
    if (!report) throw new NotFoundException('清单不存在或已禁用');
    return report;
  }

  /**
   * 创建清单配置
   */
  async create(data: Partial<Report>) {
    const report = this.reportRepository.create(data);
    return this.reportRepository.save(report);
  }

  /**
   * 更新清单配置
   */
  async update(id: number, data: Partial<Report>) {
    await this.reportRepository.update(id, data);
    return this.findOne(id);
  }

  /**
   * 删除清单
   */
  async remove(id: number) {
    const report = await this.findOne(id);
    return this.reportRepository.remove(report);
  }

  /**
   * 获取所有清单分类（用于前端分类筛选）
   */
  async getCategories() {
    const result = await this.reportRepository
      .createQueryBuilder('report')
      .select('DISTINCT report.category', 'category')
      .where('report.status = 1')
      .getRawMany();
    return result.map((r) => r.category);
  }
}