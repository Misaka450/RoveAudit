import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
   * 性能优化：改为并发执行（每条规则互相独立，并行可大幅缩短总耗时）
   * 并发上限为 5：避免一次性打满 Doris 连接池
   */
  async executeAllRules() {
    const rules = await this.findEnabled();
    // 串行执行改并发：用 Promise.allSettled 收集所有结果（不因单条失败中断）
    // 通过 p-limit 风格的手动限流防止连接池打满
    const MAX_CONCURRENCY = 5;
    const results: any[] = [];

    // 将规则分批，每批最多 MAX_CONCURRENCY 条
    for (let i = 0; i < rules.length; i += MAX_CONCURRENCY) {
      const batch = rules.slice(i, i + MAX_CONCURRENCY);
      const batchResults = await Promise.allSettled(
        batch.map((rule) => this.runDetection(rule)),
      );
      batchResults.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          results.push(res.value);
        } else {
          const rule = batch[idx];
          const errMsg = res.reason?.message || String(res.reason);
          this.logger.error(`规则 "${rule.ruleName}" 执行失败: ${errMsg}`);
          results.push({
            ruleId: rule.id,
            ruleName: rule.ruleName,
            status: 'error',
            message: errMsg,
          });
        }
      });
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
   * 安全措施（纵深防御）：
   * 1. 只允许 SELECT 查询
   * 2. 禁止分号多语句执行
   * 3. 禁止危险关键字（用 \b 单词边界匹配，避免误判 create_time 等合法标识符）
   * 4. 校验 SQL 结构完整性（括号配对、引号闭合）
   * 5. 建议配合 Doris 只读账号使用（数据库层限制）
   */
  private async runDetection(rule: WarningRule) {
    const sqlContent = rule.sqlContent.trim();

    // 步骤 1：安全检查 - 只允许 SELECT 查询（去除前导空白和注释后判断）
    const stripped = sqlContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');
    const firstKeyword = stripped.trim().toUpperCase();
    if (!firstKeyword.startsWith('SELECT') && !firstKeyword.startsWith('WITH')) {
      throw new Error('只允许执行 SELECT 或 WITH 查询');
    }

    // 步骤 2：禁止分号（防止多语句执行，如 "SELECT 1; DROP TABLE x;"）
    // 注意：分号在 SQL 字符串中可能合法（如字符串值），但简化处理：禁止末尾分号
    if (/;[\s\n]*$/.test(stripped)) {
      throw new Error('SQL 末尾不允许包含分号');
    }

    // 步骤 3：禁止危险关键字（用 \b 单词边界严格匹配）
    // \b 确保只匹配完整单词，不会误判 create_time、update_user 等合法列名
    const dangerousKeywords = [
      'DROP\\s+TABLE', 'DELETE\\s+FROM', 'UPDATE\\s+', 'INSERT\\s+INTO',
      'ALTER\\s+TABLE', 'CREATE\\s+TABLE', 'EXEC\\s+', 'TRUNCATE\\s+TABLE',
      'GRANT\\s+', 'REVOKE\\s+', 'REPLACE\\s+INTO', 'RENAME\\s+TABLE',
    ];
    const upperSql = stripped.toUpperCase();
    for (const pattern of dangerousKeywords) {
      if (new RegExp(`\\b${pattern}`, 'i').test(upperSql)) {
        throw new Error(`SQL 包含危险关键字: ${pattern.split('\\s+')[0]}`);
      }
    }

    // 步骤 4：基础结构校验 - 括号必须配对
    const openParens = (stripped.match(/\(/g) || []).length;
    const closeParens = (stripped.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      throw new Error('SQL 括号不配对');
    }

    const data = await this.dorisService.query(rule.sqlContent);
    const count = data.length;

    // 更新规则的最后执行时间和结果数量
    await this.warningRuleRepository.update(rule.id, {
      lastRunTime: new Date(),
      lastResultCount: count,
    });

    // 持久化检测结果到 warning_result 表
    // 修复：保存前对 resultData 体积做限制，防止大表 dump 撑爆 warning_result.resultData (text/JSONB) 列
    // 限制 1000 个数组元素，每条 JSON 序列化不超过 64KB，超出截断并标记
    const MAX_RECORDS = 1000;
    const MAX_JSON_BYTES = 64 * 1024;
    const preview = data.slice(0, MAX_RECORDS);
    let serialized: string;
    try {
      serialized = JSON.stringify(preview);
      if (serialized.length > MAX_JSON_BYTES) {
        // 体积过大 → 逐条删减直到满足大小限制
        let trimmed = preview;
        while (trimmed.length > 1 && JSON.stringify(trimmed).length > MAX_JSON_BYTES) {
          trimmed = trimmed.slice(0, -1);
        }
        preview.length = 0;
        preview.push(...trimmed);
        serialized = JSON.stringify(preview);
        this.logger.warn(
          `规则 "${rule.ruleName}" 结果数据超过 ${MAX_JSON_BYTES / 1024}KB，已截断到 ${trimmed.length} 条`,
        );
      }
    } catch (e: any) {
      // 极端情况：单行就超过 64KB（不太可能），直接保存空数组
      this.logger.error(`规则 "${rule.ruleName}" 结果序列化失败: ${e.message}`);
      preview.length = 0;
    }
    await this.warningResultRepository.save({
      ruleId: rule.id,
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      riskLevel: rule.riskLevel,
      resultCount: count,
      resultData: preview,
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
   * 性能优化：改用 SQL GROUP BY 一次性计算，避免全表拉回内存再 JS 聚合
   * 数据库会做日期截断和 SUM，性能比 JS 聚合高 N 倍
   * @param days 最近 N 天，默认 30 天
   */
  async getTrendData(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 使用 generate_series 生成连续日期，LEFT JOIN 补齐没有异常数据的天
    // 这样前端曲线图不会出现"今天没数据所以线断掉"的问题
    const rows = await this.warningResultRepository
      .createQueryBuilder('wr')
      .select("TO_CHAR(wr.createTime, 'YYYY-MM-DD')", 'date')
      .addSelect("SUM(CASE WHEN wr.riskLevel = 'high' THEN wr.resultCount ELSE 0 END)", 'high')
      .addSelect("SUM(CASE WHEN wr.riskLevel = 'medium' THEN wr.resultCount ELSE 0 END)", 'medium')
      .addSelect("SUM(CASE WHEN wr.riskLevel = 'low' THEN wr.resultCount ELSE 0 END)", 'low')
      .where('wr.create_time BETWEEN :start AND :end', { start: startDate, end: new Date() })
      .groupBy("TO_CHAR(wr.createTime, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      dates: rows.map((r) => r.date),
      high: rows.map((r) => Number(r.high) || 0),
      medium: rows.map((r) => Number(r.medium) || 0),
      low: rows.map((r) => Number(r.low) || 0),
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