import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 菜单表 - sys_menu
 * 控制前端左侧导航菜单的显示和排序
 */
@Entity('sys_menu')
export class Menu {
  @PrimaryGeneratedColumn({ comment: '菜单ID' })
  id: number;

  @Column({ name: 'menu_name', length: 50, comment: '菜单名称（如：清单中心）' })
  menuName: string;

  @Column({ name: 'parent_id', default: 0, comment: '父菜单ID（0表示顶级菜单）' })
  parentId: number;

  @Column({ length: 200, nullable: true, comment: '前端路由路径（如：/report-center）' })
  path: string;

  @Column({ length: 50, nullable: true, comment: '菜单图标（Ant Design 图标名）' })
  icon: string;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '排序号（越小越靠前）' })
  sortOrder: number;

  @Column({ type: 'smallint', default: 1, comment: '状态：1-启用 0-禁用' })
  status: number;

  @CreateDateColumn({ name: 'create_time', type: 'timestamp', comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time', type: 'timestamp', comment: '更新时间' })
  updateTime: Date;
}