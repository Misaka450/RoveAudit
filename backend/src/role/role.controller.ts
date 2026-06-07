import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';

/**
 * 角色管理控制器
 */
@ApiTags('角色管理')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({ summary: '查询角色列表' })
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '查询角色详情' })
  findOne(@Param('id') id: number) {
    return this.roleService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建角色' })
  create(@Body() data: CreateRoleDto) {
    return this.roleService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新角色（含分配菜单和权限）' })
  update(@Param('id') id: number, @Body() data: Partial<CreateRoleDto>) {
    return this.roleService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  remove(@Param('id') id: number) {
    return this.roleService.remove(id);
  }
}