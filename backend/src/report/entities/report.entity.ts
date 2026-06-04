import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 清单配置表 - sys_report
 * 配置化清单的核心：一行配置对应一个 Doris 数据查询
 * 新增清单只需在此表插入一条配置即可，无需修改代码
 */
@Entity('sys_report')
export class Report {
  @PrimaryGeneratedColumn({ comment: '清单ID' })
  id: number;

  @Column({ name: 'report_name', length: 100, comment: '清单名称（如：用户发展清单）' })
  reportName: string;

  @Column({ name: 'report_code', length: 50, unique: true, comment: '清单编码（如：user_develop）' })
  reportCode: string;

  @Column({ length: 50, comment: '清单分类（如：用户类、收入类、稽核类）' })
  category: string;

  @Column({ type: 'text', nullable: true, comment: '清单描述' })
  description: string;

  @Column({ name: 'sql_content', type: 'mediumtext', comment: '查询 SQL 语句（用于查询 Doris 业务数据）' })
  sqlContent: string;

  @Column({ name: 'query_params', type: 'text', nullable: true, comment: '查询参数配置（JSON格式，如：[{name:"date",type:"date"}]）' })
  queryParams: string;

  @Column({ name: 'enable_download', type: 'tinyint', default: 1, comment: '是否允许下载：1-允许 0-禁止' })
  enableDownload: number;

  @Column({ name: 'enable_chart', type: 'tinyint', default: 0, comment: '是否支持图表分析：1-支持 0-不支持' })
  enableChart: number;

  @Column({ type: 'tinyint', default: 1, comment: '状态：1-启用 0-禁用' })
  status: number;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '排序号（越小越靠前）' })
  sortOrder: number;

  @CreateDateColumn({ name: 'create_time', comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time', comment: '更新时间' })
  updateTime: Date;
}