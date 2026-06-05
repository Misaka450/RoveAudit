import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 异常规则表 - sys_warning_rule
 * 管理员配置异常检测 SQL 规则，系统定时执行并产生异常结果
 */
@Entity('sys_warning_rule')
export class WarningRule {
  @PrimaryGeneratedColumn({ comment: '规则ID' })
  id: number;

  @Column({ name: 'rule_name', length: 100, comment: '规则名称（如：用户数据异常检测）' })
  ruleName: string;

  @Column({ name: 'rule_type', length: 50, comment: '规则类型（如：数据波动、趋势异常、流量异常）' })
  ruleType: string;

  @Column({ name: 'sql_content', type: 'text', comment: '异常检测 SQL 语句' })
  sqlContent: string;

  @Column({ name: 'risk_level', length: 20, default: 'low', comment: '风险等级：high/medium/low' })
  riskLevel: string;

  @Column({ name: 'enable_flag', type: 'smallint', default: 1, comment: '是否启用：1-启用 0-禁用' })
  enableFlag: number;

  @Column({ name: 'last_run_time', type: 'timestamp', nullable: true, comment: '最后一次执行时间' })
  lastRunTime: Date;

  @Column({ name: 'last_result_count', type: 'int', default: 0, comment: '最后一次检测出的异常数量' })
  lastResultCount: number;

  @CreateDateColumn({ name: 'create_time', type: 'timestamp', comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time', type: 'timestamp', comment: '更新时间' })
  updateTime: Date;
}