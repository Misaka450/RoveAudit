import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * 下载日志表 - sys_download_log
 * 记录所有下载操作，用于审计追溯
 */
@Entity('sys_download_log')
export class DownloadLog {
  @PrimaryGeneratedColumn({ comment: '日志ID' })
  id: number;

  @Column({ name: 'user_id', comment: '下载用户ID' })
  userId: number;

  @Column({ name: 'username', length: 50, comment: '下载用户账号' })
  username: string;

  @Column({ name: 'report_id', comment: '下载的清单ID' })
  reportId: number;

  @Column({ name: 'report_name', length: 100, comment: '下载的清单名称' })
  reportName: string;

  @Column({ name: 'file_name', length: 200, comment: '下载文件名' })
  fileName: string;

  @Column({ name: 'file_type', length: 10, comment: '文件类型：excel / csv' })
  fileType: string;

  @Column({ name: 'data_count', type: 'int', default: 0, comment: '下载数据条数' })
  dataCount: number;

  @Column({ length: 50, nullable: true, comment: '下载IP地址' })
  ip: string;

  @CreateDateColumn({ name: 'download_time', type: 'timestamp', comment: '下载时间' })
  downloadTime: Date;
}