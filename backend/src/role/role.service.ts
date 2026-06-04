import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Menu } from '../menu/entities/menu.entity';
import { Permission } from './entities/permission.entity';

/**
 * 角色管理服务
 */
@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  /**
   * 查询所有角色（含关联的菜单和权限）
   */
  async findAll() {
    return this.roleRepository.find({
      relations: ['menus', 'permissions'],
      order: { createTime: 'DESC' },
    });
  }

  /**
   * 根据ID查询角色
   */
  async findOne(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['menus', 'permissions'],
    });
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  /**
   * 创建角色
   */
  async create(data: { roleName: string; roleCode: string; description?: string; menuIds?: number[]; permissionIds?: number[] }) {
    const role = this.roleRepository.create(data);

    if (data.menuIds?.length) {
      role.menus = await this.menuRepository.findBy({ id: In(data.menuIds) });
    }
    if (data.permissionIds?.length) {
      role.permissions = await this.permissionRepository.findBy({ id: In(data.permissionIds) });
    }

    return this.roleRepository.save(role);
  }

  /**
   * 更新角色（含菜单、权限分配）
   */
  async update(id: number, data: any) {
    const role = await this.findOne(id);
    const { menuIds, permissionIds, ...updateData } = data;

    Object.assign(role, updateData);

    if (menuIds !== undefined) {
      role.menus = menuIds.length > 0 ? await this.menuRepository.findBy({ id: In(menuIds) }) : [];
    }
    if (permissionIds !== undefined) {
      role.permissions = permissionIds.length > 0 ? await this.permissionRepository.findBy({ id: In(permissionIds) }) : [];
    }

    return this.roleRepository.save(role);
  }

  /**
   * 删除角色
   */
  async remove(id: number) {
    const role = await this.findOne(id);
    return this.roleRepository.remove(role);
  }
}