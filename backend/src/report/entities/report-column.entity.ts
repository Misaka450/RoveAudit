import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 清单字段配置表 - sys_report_column
 * 配置清单每一列的展示属性（中文名、宽度、对齐方式等）
 * 稽核人员在此配置后，前端自动渲染列名、筛选器
 */
@Entity('sys_report_column')
export class ReportColumn {
  @PrimaryGeneratedColumn({ comment: '配置ID' })
  id: number;

  @Column({ name: 'report_code', length: 50, comment: '关联清单编码' })
  reportCode: string;

  @Column({ name: 'column_name', length: 100, comment: 'Doris字段名（如 user_count）' })
  columnName: string;

  @Column({ name: 'column_label', length: 100, nullable: true, comment: '中文显示名（如 用户数）' })
  columnLabel: string;

  @Column({ type: 'int', default: 150, comment: '列宽（px）' })
  width: number;

  @Column({ length: 20, default: 'left', comment: '对齐方式：left / center / right' })
  align: string;

  @Column({ name: 'sortable', type: 'smallint', default: 1, comment: '是否可排序：1-是 0-否' })
  sortable: number;

  @Column({ name: 'filterable', type: 'smallint', default: 1, comment: '是否可筛选：1-是 0-否' })
  filterable: number;

  @Column({ name: 'visible', type: 'smallint', default: 1, comment: '默认是否显示：1-显示 0-隐藏' })
  visible: number;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '排序号（越小越靠左）' })
  sortOrder: number;

  @Column({ name: 'is_date', type: 'smallint', default: 0, comment: '是否日期类型：1-是（用于日期筛选器）' })
  isDate: number;

  @CreateDateColumn({ name: 'create_time', type: 'timestamp', comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time', type: 'timestamp', comment: '更新时间' })
  updateTime: Date;
}