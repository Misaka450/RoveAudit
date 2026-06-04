import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Menu } from '../../menu/entities/menu.entity';
import { Permission } from './permission.entity';

/**
 * 角色表 - sys_role
 * 角色是权限的集合，用户通过角色获得权限
 */
@Entity('sys_role')
export class Role {
  @PrimaryGeneratedColumn({ comment: '角色ID' })
  id: number;

  @Column({ name: 'role_name', length: 50, comment: '角色名称（如：超级管理员）' })
  roleName: string;

  @Column({ name: 'role_code', length: 50, unique: true, comment: '角色编码（如：admin）' })
  roleCode: string;

  @Column({ type: 'text', nullable: true, comment: '角色描述' })
  description: string;

  @Column({ type: 'tinyint', default: 1, comment: '状态：1-启用 0-禁用' })
  status: number;

  @CreateDateColumn({ name: 'create_time', comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time', comment: '更新时间' })
  updateTime: Date;

  // 角色与用户：多对多（双向）
  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  // 角色与菜单：多对多（菜单权限）
  @ManyToMany(() => Menu)
  @JoinTable({
    name: 'sys_role_menu',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'menu_id', referencedColumnName: 'id' },
  })
  menus: Menu[];

  // 角色与操作权限：多对多
  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'sys_role_permission',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}