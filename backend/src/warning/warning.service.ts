import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WarningRule } from './entities/warning-rule.entity';
import { WarningResult } from './entities/warning-result.entity';
import { DorisService } from '../data-query/doris.service';
import { NotificationService } from '../common/notification.service';

/**
 * 异常规则管理服务 - 异常规则的 CRUD + 定时检测
 */
@Injectable()
export class WarningService {
  private readonly logger = new Logger(WarningService.name);

  constructor(
    @InjectRepository(WarningRule)
    private warningRuleRepository: Repository<WarningRule>,
    @InjectRepository(WarningResult)
    private warningResultRepository: Repository<WarningResult>,
    private dorisService: DorisService,
    private notificationService: NotificationService,
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

  /** 删除异常规则（软删除，改为禁用状态） */
  async remove(id: number) {
    const rule = await this.findOne(id);
    rule.enableFlag = 0;
    return this.warningRuleRepository.save(rule);
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
   * 安全措施：
   * 1. 只允许 SELECT 查询
   * 2. 禁止多语句执行（分号分隔）
   * 3. 禁止危险关键字
   * 4. 建议配合 Doris 只读账号使用，从数据库层面限制写操作
   */
  private async runDetection(rule: WarningRule) {
    const sqlContent = rule.sqlContent.trim();

    // 安全检查：只允许 SELECT 查询（去除前导空白和注释后判断）
    const firstKeyword = sqlContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '').trim().toUpperCase();
    if (!firstKeyword.startsWith('SELECT')) {
      throw new Error('只允许执行 SELECT 查询');
    }

    // 安全检查：禁止分号（防止多语句执行，如 "SELECT 1; DROP TABLE x;"）
    if (sqlContent.includes(';')) {
      throw new Error('禁止执行多语句 SQL（不允许包含分号）');
    }

    // 安全检查：禁止危险关键字（在去除注释后的 SQL 中检查）
    const cleanSql = sqlContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'EXEC', 'TRUNCATE', 'GRANT', 'REVOKE'];
    const sqlWords = cleanSql.toUpperCase().split(/[\s,()]+/);
    for (const word of sqlWords) {
      if (dangerousKeywords.includes(word)) {
        throw new Error(`SQL 包含危险关键字: ${word}`);
      }
    }

    const data = await this.dorisService.query(rule.sqlContent);
    const count = data.length;

    // 更新规则的最后执行时间和结果数量
    await this.warningRuleRepository.update(rule.id, {
      lastRunTime: new Date(),
      lastResultCount: count,
    });

    // 持久化检测结果到 warning_result 表
    await this.warningResultRepository.save({
      ruleId: rule.id,
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      riskLevel: rule.riskLevel,
      resultCount: count,
      resultData: data.slice(0, 100), // 最多保存前100条
    });

    // 发现异常时发送告警通知（高风险且数量 > 0）
    if (count > 0 && rule.riskLevel === 'high') {
      this.notificationService.sendAlert(
        rule.ruleName,
        rule.ruleType,
        rule.riskLevel,
        count,
      );
    }

    this.logger.log(`规则 "${rule.ruleName}" 执行完成，发现 ${count} 条异常`);

    return {
      ruleId: rule.id,
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      riskLevel: rule.riskLevel,
      status: 'success',
      count,
      data: data.slice(0, 100),
    };
  }

  /**
   * 获取异常趋势数据（按天分组统计各风险等级的异常数量）
   * @param days 最近 N 天，默认 30 天
   */
  async getTrendData(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await this.warningResultRepository.find({
      where: { createTime: Between(startDate, new Date()) },
      order: { createTime: 'ASC' },
    });

    // 按日期 + 风险等级分组统计
    const trendMap = new Map<string, { high: number; medium: number; low: number }>();
    for (const r of results) {
      const dateKey = r.createTime.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, { high: 0, medium: 0, low: 0 });
      }
      const entry = trendMap.get(dateKey)!;
      if (r.riskLevel === 'high') entry.high += r.resultCount;
      else if (r.riskLevel === 'medium') entry.medium += r.resultCount;
      else entry.low += r.resultCount;
    }

    return {
      dates: Array.from(trendMap.keys()),
      high: Array.from(trendMap.values()).map((v) => v.high),
      medium: Array.from(trendMap.values()).map((v) => v.medium),
      low: Array.from(trendMap.values()).map((v) => v.low),
    };
  }

  /**
   * 获取异常类型占比数据（使用 SQL GROUP BY 统计，避免全表加载到内存）
   */
  async getTypeDistribution() {
    const results = await this.warningResultRepository
      .createQueryBuilder('wr')
      .select('wr.ruleType', 'name')
      .addSelect('SUM(wr.resultCount)', 'value')
      .groupBy('wr.ruleType')
      .orderBy('value', 'DESC')
      .getRawMany();

    return results.map((r) => ({ name: r.name, value: Number(r.value) }));
  }
}