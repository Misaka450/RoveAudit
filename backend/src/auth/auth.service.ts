import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';

/**
 * 认证服务 - 处理登录、Token 签发
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
   */
  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // 1. 查找用户（只查启用状态的）
    const user = await this.userRepository.findOne({
      where: { username, status: 1 },
      relations: ['roles', 'roles.menus', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('账号或密码错误');
    }

    // 2. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('账号或密码错误');
    }

    // 3. 收集用户的所有权限标识（从角色中汇总）
    const permissions: string[] = [];
    const menus: string[] = [];
    const roles = user.roles || [];
    for (const role of roles) {
      if (role.status === 1) {
        for (const perm of role.permissions || []) {
          if (!permissions.includes(perm.permissionKey)) {
            permissions.push(perm.permissionKey);
          }
        }
        for (const menu of role.menus || []) {
          if (!menus.includes(menu.path)) {
            menus.push(menu.path);
          }
        }
      }
    }

    // 4. 签发 JWT Token（payload 中存放用户信息和权限）
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