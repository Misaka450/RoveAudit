import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';

/**
 * 菜单管理服务 - 支持树形结构
 */
@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) {}

  /**
   * 查询菜单树（按 parentId 组装树形结构）
   * 安全修复：未传 userId 时返回空（不再泄露全量菜单）
   */
  async findTree(userId?: number) {
    // 未登录用户：返回空（修复权限泄露 bug）
    if (!userId) return [];

    // 登录用户：只返回自己有权限的菜单
    // 通过 sys_user_role → sys_role_menu → sys_menu 关联过滤
    const menus = await this.menuRepository
      .createQueryBuilder('m')
      .innerJoin('sys_role_menu', 'rm', 'rm.menu_id = m.id')
      .innerJoin('sys_user_role', 'ur', 'ur.role_id = rm.role_id')
      .innerJoin('sys_role', 'r', 'r.id = ur.role_id')
      .where('ur.user_id = :userId', { userId })
      .andWhere('m.status = 1')
      .andWhere('r.status = 1')
      .orderBy('m.sort_order', 'ASC')
      .select(['m.id', 'm.menuName', 'm.parentId', 'm.path', 'm.icon', 'm.sortOrder', 'm.status'])
      .getMany();

    return this.buildTree(menus, 0);
  }

  /**
   * 查询所有菜单（平铺列表，用于管理页面）
   */
  async findAll() {
    return this.menuRepository.find({ order: { sortOrder: 'ASC' } });
  }

  /**
   * 根据ID查询菜单
   */
  async findOne(id: number) {
    const menu = await this.menuRepository.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('菜单不存在');
    return menu;
  }

  /**
   * 创建菜单
   */
  async create(data: Partial<Menu>) {
    const menu = this.menuRepository.create(data);
    return this.menuRepository.save(menu);
  }

  /**
   * 更新菜单
   */
  async update(id: number, data: Partial<Menu>) {
    await this.menuRepository.update(id, data);
    return this.findOne(id);
  }

  /**
   * 删除菜单
   */
  async remove(id: number) {
    const menu = await this.findOne(id);
    return this.menuRepository.remove(menu);
  }

  /**
   * 递归构建树形结构（用于前端菜单渲染）
   * 优化：先构建 parentId → children 的 Map，复杂度 O(n)
   */
  private buildTree(menus: Menu[], parentId: number): any[] {
    // 构建 parentId → 子菜单数组的映射（仅遍历一次）
    const childrenMap = new Map<number, Menu[]>();
    for (const m of menus) {
      const pid = m.parentId;
      if (!childrenMap.has(pid)) {
        childrenMap.set(pid, []);
      }
      childrenMap.get(pid)!.push(m);
    }

    // 递归组装树
    const build = (pid: number): any[] => {
      const children = childrenMap.get(pid) || [];
      return children.map((menu) => ({
        ...menu,
        children: build(menu.id),
      }));
    };

    return build(parentId);
  }
}