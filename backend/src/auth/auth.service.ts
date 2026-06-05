import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';

/**
 * 认证服务 - 处理登录、JWT Token 签发
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户登录 - 验证账号密码并返回 JWT Token
   * 优化：只加载需要的字段，权限通过单独查询获取，避免一次性加载整棵权限树
   */
  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // 1. 查找用户（只查启用状态），只加载角色关系（不级联加载菜单和权限）
    const user = await this.userRepository.findOne({
      where: { username, status: 1 },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('账号或密码错误');
    }

    // 2. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('账号或密码错误');
    }

    // 3. 收集权限：通过角色ID单独查询（避免 TypeORM 懒加载 N+1 问题）
    const permissions: string[] = [];
    const menus: string[] = [];
    const roles = user.roles || [];

    // 只对启用的角色加载权限和菜单
    const activeRoleIds = roles.filter((r) => r.status === 1).map((r) => r.id);
    if (activeRoleIds.length > 0) {
      // 使用原始查询，只取需要的字段，避免加载整条记录
      const perms = await this.userRepository.query(
        `SELECT DISTINCT p.permission_key
         FROM sys_role r
         JOIN sys_role_permission rp ON r.id = rp.role_id
         JOIN sys_permission p ON rp.permission_id = p.id
         WHERE r.id = ANY($1) AND r.status = 1`,
        [activeRoleIds],
      );
      for (const p of perms) {
        permissions.push(p.permission_key);
      }

      const menuList = await this.userRepository.query(
        `SELECT DISTINCT m.path
         FROM sys_role r
         JOIN sys_role_menu rm ON r.id = rm.role_id
         JOIN sys_menu m ON rm.menu_id = m.id
         WHERE r.id = ANY($1) AND r.status = 1 AND m.status = 1`,
        [activeRoleIds],
      );
      for (const m of menuList) {
        menus.push(m.path);
      }
    }

    // 4. 签发 JWT Token（payload 中存放用户信息和权限清单）
    const payload = {
      userId: user.id,
      username: user.username,
      realName: user.realName,
      permissions,
      menus,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        department: user.department,
        permissions,
        menus,
      },
    };
  }
}