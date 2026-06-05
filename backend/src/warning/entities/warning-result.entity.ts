import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * 异常检测结果表 - sys_warning_result
 * 每次规则执行检测到的异常数据明细，用于展示趋势图和历史记录
 */
@Entity('sys_warning_result')
export class WarningResult {
  @PrimaryGeneratedColumn({ comment: '结果ID' })
  id: number;

  @Column({ name: 'rule_id', comment: '关联规则ID' })
  ruleId: number;

  @Column({ name: 'rule_name', length: 100, comment: '规则名称' })
  ruleName: string;

  @Column({ name: 'rule_type', length: 50, comment: '规则类型' })
  ruleType: string;

  @Column({ name: 'risk_level', length: 20, comment: '风险等级' })
  riskLevel: string;

  @Column({ name: 'result_count', type: 'int', default: 0, comment: '本次检测异常数量' })
  resultCount: number;

  @Column({ name: 'result_data', type: 'jsonb', nullable: true, comment: '异常数据快照（前100条）' })
  resultData: Record<string, any>[];

  @CreateDateColumn({ name: 'create_time', type: 'timestamp', comment: '检测时间' })
  createTime: Date;
}