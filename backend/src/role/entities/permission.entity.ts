import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * 操作权限表 - sys_permission
 * 存储所有可细分的操作权限（查看、下载、导出等）
 */
@Entity('sys_permission')
export class Permission {
  @PrimaryGeneratedColumn({ comment: '权限ID' })
  id: number;

  @Column({ name: 'permission_name', length: 50, comment: '权限名称（如：查看）' })
  permissionName: string;

  @Column({ name: 'permission_key', length: 100, unique: true, comment: '权限标识（如：report:view）' })
  permissionKey: string;

  @Column({ length: 200, nullable: true, comment: '权限描述' })
  description: string;
}