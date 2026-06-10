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
   * 批量导入用户（限制最多 500 行）
   * 性能优化：把循环中的多次数据库查询合并：
   *   1. 一次性查全表已存在的 username（避免 N 次 SELECT）
   *   2. 一次性查全表角色名（避免 N 次 SELECT）
   * 配合并发批量创建，导入 500 条从分钟级降到秒级
   */
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

    // 1. 前置过滤：必填字段检查
    const validRows: ImportUserRowDto[] = [];
    for (const row of data) {
      if (!row.username || !row.realName || !row.password) {
        results.failed++;
        results.errors.push(`${row.username || '(空账号)'}: 缺少必填字段（账号、姓名、密码）`);
      } else {
        validRows.push(row);
      }
    }
    if (!validRows.length) return results;

    // 2. 一次性查出所有待插入账号是否已存在（一次 IN 查询）
    const usernames = validRows.map((r) => r.username);
    const existing = await this.userRepository.find({
      where: usernames.map((u) => ({ username: u })),
      select: ['username'],
    });
    const existingSet = new Set(existing.map((u) => u.username));
    const newRows = validRows.filter((r) => {
      if (existingSet.has(r.username)) {
        results.failed++;
        results.errors.push(`${r.username}: 账号已存在`);
        return false;
      }
      return true;
    });

    // 3. 一次性查全表所有角色（按角色名匹配用户）
    const allRoles = await this.roleRepository.find();
    const roleMap = new Map(allRoles.map((r) => [r.roleName, r]));

    // 4. 并发执行：每条独立，互相无依赖，限制并发 10 防连接池打满
    const CONCURRENCY = 10;
    for (let i = 0; i < newRows.length; i += CONCURRENCY) {
      const batch = newRows.slice(i, i + CONCURRENCY);
      await Promise.allSettled(
        batch.map(async (row) => {
          try {
            const hashedPassword = await bcrypt.hash(String(row.password), 10);
            const user = this.userRepository.create({
              username: row.username,
              realName: row.realName,
              department: row.department || '',
              phone: row.phone || '',
              password: hashedPassword,
              status: 1,
            });
            // 按角色名匹配（从预加载的角色表中查）
            if (row.roleNames) {
              const roleNames = String(row.roleNames).split(/[,，、\s]+/).filter(Boolean);
              const matchedRoles = roleNames
                .map((name) => roleMap.get(name))
                .filter(Boolean) as typeof allRoles;
              if (matchedRoles.length) user.roles = matchedRoles;
            }
            await this.userRepository.save(user);
            results.success++;
          } catch (e: any) {
            results.failed++;
            results.errors.push(`${row.username || '(未知)'}: ${e.message}`);
          }
        }),
      );
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