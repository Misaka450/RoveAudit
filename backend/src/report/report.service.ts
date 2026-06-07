import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Report } from './entities/report.entity';
import { CacheService } from '../common/cache.service';

/**
 * 清单配置管理服务 - 配置化清单的核心
 * 新增清单只需在此插入一条配置，无需修改代码
 */
@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    private cacheService: CacheService,
  ) {}

  /**
   * 查询所有启用的清单（按分类和排序号排列）
   */
  async findAll(category?: string) {
    // 缓存 30 秒，避免频繁查询
    const cacheKey = category ? `reports:${category}` : 'reports:all';
    const cached = this.cacheService.get(cacheKey);
    if (cached) return cached;

    const where: FindOptionsWhere<Report> = { status: 1 };
    if (category) {
      where.category = category;
    }
    const result = await this.reportRepository.find({
      where,
      order: { category: 'ASC', sortOrder: 'ASC' },
      select: ['id', 'reportName', 'reportCode', 'category', 'description', 'enableDownload', 'enableChart', 'sortOrder', 'updateTime'],
    });

    this.cacheService.set(cacheKey, result);
    return result;
  }

  /**
   * 查询所有清单（包括禁用，用于管理页面）
   */
  async findAllAdmin(keyword?: string) {
    const where: FindOptionsWhere<Report> = {};
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

  /** 清除清单相关缓存（在增/删/改后调用，避免脏数据） */
  private clearCache() {
    // 批量清除所有 reports: 前缀的缓存（包括 reports:all、reports:{category}、report:code:{code} 等）
    this.cacheService.delByPrefix('reports:');
    this.cacheService.delByPrefix('report:');
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
    const cacheKey = `report:code:${reportCode}`;
    const cached = this.cacheService.get<Report>(cacheKey);
    if (cached) return cached;

    const report = await this.reportRepository.findOne({
      where: { reportCode, status: 1 },
    });
    if (!report) throw new NotFoundException('清单不存在或已禁用');

    this.cacheService.set(cacheKey, report);
    return report;
  }

  /**
   * 创建清单配置
   */
  async create(data: Partial<Report>) {
    const report = this.reportRepository.create(data);
    const saved = await this.reportRepository.save(report);
    this.clearCache();
    return saved;
  }

  /**
   * 更新清单配置
   */
  async update(id: number, data: Partial<Report>) {
    await this.reportRepository.update(id, data);
    this.clearCache();
    return this.findOne(id);
  }

  /**
   * 删除清单（软删除，改为禁用状态）
   */
  async remove(id: number) {
    const report = await this.findOne(id);
    report.status = 0;
    const result = await this.reportRepository.save(report);
    this.clearCache();
    return result;
  }

  /**
   * 获取所有清单分类（用于前端分类筛选）
   */
  async getCategories() {
    const cached = this.cacheService.get<string[]>('reports:categories');
    if (cached) return cached;

    const result = await this.reportRepository
      .createQueryBuilder('report')
      .select('DISTINCT report.category', 'category')
      .where('report.status = 1')
      .getRawMany();
    const categories = result.map((r) => r.category);

    this.cacheService.set('reports:categories', categories);
    return categories;
  }
}