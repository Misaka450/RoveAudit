import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * 操作审计日志表 - sys_audit_log
 * 记录用户的关键操作（登录、查询、下载、修改配置等）
 */
@Entity('sys_audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn({ comment: '日志ID' })
  id: number;

  @Column({ name: 'user_id', nullable: true, comment: '操作用户ID' })
  userId: number;

  @Column({ length: 50, nullable: true, comment: '操作用户账号' })
  username: string;

  @Column({ length: 200, comment: '操作描述' })
  action: string;

  @Column({ length: 100, nullable: true, comment: '操作模块' })
  module: string;

  @Column({ length: 100, nullable: true, comment: '请求方法' })
  method: string;

  @Column({ length: 500, nullable: true, comment: '请求路径' })
  path: string;

  @Column({ type: 'text', nullable: true, comment: '请求参数（JSON）' })
  params: string;

  @Column({ length: 50, nullable: true, comment: 'IP地址' })
  ip: string;

  @Column({ type: 'smallint', default: 1, comment: '操作状态：1-成功 0-失败' })
  status: number;

  @Column({ name: 'error_msg', type: 'text', nullable: true, comment: '错误信息' })
  errorMsg: string;

  @Column({ type: 'int', nullable: true, comment: '耗时（毫秒）' })
  duration: number;

  @CreateDateColumn({ name: 'create_time', type: 'timestamp', comment: '操作时间' })
  createTime: Date;
}
