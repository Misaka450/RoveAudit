import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CacheService } from '../common/cache.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ImportUserRowDto } from './dto/batch-import.dto';

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
    private cacheService: CacheService,
  ) {}

  /** 查询用户列表（支持按账号、姓名模糊搜索，支持分页） */
  async findAll(keyword?: string, page?: number, pageSize?: number) {
    const DEFAULT_PAGE_SIZE = 50;
    const MAX_PAGE_SIZE = 200;
    const effectivePageSize = pageSize ? Math.min(pageSize, MAX_PAGE_SIZE) : (page ? DEFAULT_PAGE_SIZE : undefined);

    const where = keyword
      ? [
          { username: Like(`%${keyword}%`) },
          { realName: Like(`%${keyword}%`) },
        ]
      : {};

    if (page && effectivePageSize) {
      const skip = (page - 1) * effectivePageSize;
      const [list, total] = await this.userRepository.findAndCount({
        where,
        relations: ['roles'],
        order: { createTime: 'DESC' },
        skip,
        take: effectivePageSize,
      });
      return { list, total };
    }

    // 不分页时设置上限，防止返回过多数据
    return this.userRepository.find({
      where,
      relations: ['roles'],
      order: { createTime: 'DESC' },
      take: MAX_PAGE_SIZE,
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

    const savedUser = await this.userRepository.save(user);
    this.cacheService.del(`user:permissions:${id}`);
    return savedUser;
  }

  /**
   * 重置密码
   */
  async resetPassword(id: number, newPassword: string) {
    const user = await this.findOne(id);
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
    return { success: true, message: '密码重置成功' };
  }

  /**
   * 批量导入用户
   /** 批量导入用户（限制最多 500 行） */
   async batchImport(data: ImportUserRowDto[]) {
     const MAX_BATCH_IMPORT_ROWS = 500;
     if (data.length > MAX_BATCH_IMPORT_ROWS) {
       return {
         success: 0,
         failed: data.length,
         errors: [`单次导入不能超过 ${MAX_BATCH_IMPORT_ROWS} 条，当前 ${data.length} 条`],
       };
     }
     const results: { success: number; failed: number; errors: string[] } = { success: 0, failed: 0, errors: [] };
     for (const row of data) {
       try {
         if (!row.username || !row.realName || !row.password) {
           results.failed++;
           results.errors.push(`${row.username || '(空账号)'}: 缺少必填字段（账号、姓名、密码）`);
           continue;
         }
         const exist = await this.userRepository.findOne({ where: { username: row.username } });
         if (exist) {
           results.failed++;
           results.errors.push(`${row.username}: 账号已存在`);
           continue;
         }
         const hashedPassword = await bcrypt.hash(String(row.password), 10);
         const user = this.userRepository.create({
           username: row.username,
           realName: row.realName,
           department: row.department || '',
           phone: row.phone || '',
           password: hashedPassword,
           status: 1,
         });
         // 按角色名匹配
         if (row.roleNames) {
           const roleNames = String(row.roleNames).split(/[,，、\s]+/).filter(Boolean);
           if (roleNames.length) {
             const matchedRoles = await this.roleRepository.find({
               where: roleNames.map((name: string) => ({ roleName: name })),
             });
             if (matchedRoles.length) user.roles = matchedRoles;
           }
         }
         await this.userRepository.save(user);
         results.success++;
       } catch (e: any) {
         results.failed++;
         results.errors.push(`${row.username || '(未知)'}: ${e.message}`);
       }
     }
     return results;
   }

   /** 删除用户（软删除，改为禁用状态） */
  async remove(id: number) {
    const user = await this.findOne(id);
    user.status = 0;
    return this.userRepository.save(user);
  }
}