import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Role } from '../../role/entities/role.entity';

/**
 * 用户表 - sys_user
 * 存储平台所有使用者的账号信息
 */
@Entity('sys_user')
export class User {
  @PrimaryGeneratedColumn({ comment: '用户ID' })
  id: number;

  @Column({ length: 50, unique: true, comment: '登录账号' })
  username: string;

  @Column({ length: 200, comment: '加密密码' })
  password: string;

  @Column({ name: 'real_name', length: 50, comment: '真实姓名' })
  realName: string;

  @Column({ length: 100, nullable: true, comment: '所属部门' })
  department: string;

  @Column({ length: 20, nullable: true, comment: '手机号' })
  phone: string;

  @Column({ type: 'tinyint', default: 1, comment: '状态：1-启用 0-禁用' })
  status: number;

  @CreateDateColumn({ name: 'create_time', comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time', comment: '更新时间' })
  updateTime: Date;

  // 用户与角色：多对多关系
  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'sys_user_role', // 中间表名
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}