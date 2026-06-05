import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 清单图表配置表 - sys_report_chart
 * 配置化分析图表的核心：一行配置对应一个 ECharts 图表
 * 稽核人员在此配置后，前端自动渲染图表，无需开发介入
 */
@Entity('sys_report_chart')
export class ReportChart {
  @PrimaryGeneratedColumn({ comment: '图表配置ID' })
  id: number;

  @Column({ name: 'report_code', length: 50, comment: '关联清单编码' })
  reportCode: string;

  @Column({ name: 'chart_title', length: 100, comment: '图表标题' })
  chartTitle: string;

  @Column({ name: 'chart_type', length: 20, comment: '图表类型：line/bar/pie/area' })
  chartType: string;

  @Column({ name: 'dimension_column', length: 100, comment: '维度列（X轴/分类字段名）' })
  dimensionColumn: string;

  @Column({ name: 'metric_columns', type: 'text', comment: '指标列（Y轴/数值字段，JSON数组，如 ["user_count","active_count"]）' })
  metricColumns: string;

  @Column({ name: 'metric_labels', type: 'text', nullable: true, comment: '指标中文名（JSON对象，如 {"user_count":"用户数","active_count":"活跃数"}）' })
  metricLabels: string;

  @Column({ name: 'is_ring', type: 'smallint', default: 0, comment: '饼图是否环形：1-环形 0-普通（仅饼图有效）' })
  isRing: number;

  @Column({ type: 'smallint', default: 1, comment: '状态：1-启用 0-禁用' })
  status: number;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '排序号' })
  sortOrder: number;

  @CreateDateColumn({ name: 'create_time', type: 'timestamp', comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time', type: 'timestamp', comment: '更新时间' })
  updateTime: Date;
}