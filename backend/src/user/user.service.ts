import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * 用户管理服务
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * 查询用户列表（支持按账号、姓名模糊搜索）
   */
  async findAll(keyword?: string) {
    const where: any = {};
    if (keyword) {
      // 模糊搜索：账号或姓名包含关键词
      return this.userRepository.find({
        where: [
          { username: Like(`%${keyword}%`) },
          { realName: Like(`%${keyword}%`) },
        ],
        relations: ['roles'],
        order: { createTime: 'DESC' },
      });
    }
    return this.userRepository.find({
      relations: ['roles'],
      order: { createTime: 'DESC' },
    });
  }

  /**
   * 根据ID查询单个用户
   */
  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  /**
   * 创建新用户（密码自动加密）
   */
  async create(dto: CreateUserDto) {
    // 检查账号是否已存在
    const exist = await this.userRepository.findOne({ where: { username: dto.username } });
    if (exist) throw new ConflictException('账号已存在');

    // 密码加密（bcrypt 加盐哈希）
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    // 如果有角色ID，关联角色
    if (dto.roleIds?.length) {
      user.roles = await this.roleRepository.findBy({ id: In(dto.roleIds) });
    }

    return this.userRepository.save(user);
  }

  /**
   * 更新用户信息
   */
  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findOne(id);

    // 更新基本字段（排除密码，密码单独重置）
    const { roleIds, ...updateData } = dto;
    Object.assign(user, updateData);

    // 如果传了角色ID，更新角色关联
    if (roleIds) {
      user.roles = await this.roleRepository.findBy({ id: In(roleIds) });
    }

    return this.userRepository.save(user);
  }

  /**
   * 重置密码
   */
  async resetPassword(id: number, newPassword: string) {
    const user = await this.findOne(id);
    user.password = await bcrypt.hash(newPassword, 10);
    return this.userRepository.save(user);
  }

  /**
   * 删除用户（软删除，改为禁用状态）
   */
  async remove(id: number) {
    const user = await this.findOne(id);
    user.status = 0;
    return this.userRepository.save(user);
  }
}