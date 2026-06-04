import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Menu } from '../menu/entities/menu.entity';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';

/**
 * 角色模块 - 角色CRUD + 菜单/权限分配
 */
@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, Menu])],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}