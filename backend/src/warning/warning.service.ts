import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WarningRule } from './entities/warning-rule.entity';
import { DorisService } from '../data-query/doris.service';

/**
 * 异常规则管理服务 - 异常规则的 CRUD + 定时检测
 */
@Injectable()
export class WarningService {
  private readonly logger = new Logger(WarningService.name);

  constructor(
    @InjectRepository(WarningRule)
    private warningRuleRepository: Repository<WarningRule>,
    private dorisService: DorisService,
  ) {}

  /**
   * 查询所有异常规则
   */
  async findAll() {
    return this.warningRuleRepository.find({
      order: { createTime: 'DESC' },
    });
  }

  /**
   * 查询已启用的异常规则
   */
  async findEnabled() {
    return this.warningRuleRepository.find({
      where: { enableFlag: 1 },
      order: { riskLevel: 'DESC', createTime: 'ASC' },
    });
  }

  /**
   * 根据ID查询规则
   */
  async findOne(id: number) {
    const rule = await this.warningRuleRepository.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('异常规则不存在');
    return rule;
  }

  /**
   * 创建异常规则
   */
  async create(data: Partial<WarningRule>) {
    const rule = this.warningRuleRepository.create(data);
    return this.warningRuleRepository.save(rule);
  }

  /**
   * 更新异常规则
   */
  async update(id: number, data: Partial<WarningRule>) {
    await this.warningRuleRepository.update(id, data);
    return this.findOne(id);
  }

  /**
   * 删除异常规则
   */
  async remove(id: number) {
    const rule = await this.findOne(id);
    return this.warningRuleRepository.remove(rule);
  }

  /**
   * 执行单条异常检测规则
   */
  async executeRule(ruleId: number) {
    const rule = await this.findOne(ruleId);
    return this.runDetection(rule);
  }

  /**
   * 执行所有已启用的异常规则
   */
  async executeAllRules() {
    const rules = await this.findEnabled();
    const results: any[] = [];

    for (const rule of rules) {
      try {
        const result = await this.runDetection(rule);
        results.push(result);
      } catch (error) {
        this.logger.error(`规则 "${rule.ruleName}" 执行失败: ${error.message}`);
        results.push({
          ruleId: rule.id,
          ruleName: rule.ruleName,
          status: 'error',
          message: error.message,
        });
      }
    }

    return results;
  }

  /**
   * 定时任务：每30分钟自动执行一次异常检测
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduledDetection() {
    this.logger.log('开始定时异常检测...');
    const results = await this.executeAllRules();
    const totalAbnormal = results
      .filter((r) => r.status === 'success')
      .reduce((sum, r) => sum + r.count, 0);
    this.logger.log(`定时异常检测完成，共发现 ${totalAbnormal} 条异常`);
  }

  /**
   * 执行单条检测规则的核心逻辑
   */
  private async runDetection(rule: WarningRule) {
    const trimmedSql = rule.sqlContent.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT')) {
      throw new Error('只允许执行 SELECT 查询');
    }

    const data = await this.dorisService.query(rule.sqlContent);
    const count = data.length;

    // 更新规则的最后执行时间和结果数量
    await this.warningRuleRepository.update(rule.id, {
      lastRunTime: new Date(),
      lastResultCount: count,
    });

    this.logger.log(`规则 "${rule.ruleName}" 执行完成，发现 ${count} 条异常`);

    return {
      ruleId: rule.id,
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      riskLevel: rule.riskLevel,
      status: 'success',
      count,
      data: data.slice(0, 100), // 最多返回前100条
    };
  }
}