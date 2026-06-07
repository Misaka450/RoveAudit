import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * 用户管理控制器
 */
@ApiTags('用户管理')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '查询用户列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词（账号或姓名）' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数' })
  findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.userService.findAll(keyword, page ? +page : undefined, pageSize ? +pageSize : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询用户详情' })
  findOne(@Param('id') id: number) {
    return this.userService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Put(':id/reset-password')
  @ApiOperation({ summary: '重置密码' })
  resetPassword(@Param('id') id: number, @Body('password') password: string) {
    return this.userService.resetPassword(id, password);
  }

  /** 批量导入用户（限制最多 500 行） */
  @Post('batch-import')
  @ApiOperation({ summary: '批量导入用户（Excel，最多500条）' })
  batchImport(@Body() data: any[]) {
    return this.userService.batchImport(data);
  }

  @Get('template')
  @ApiOperation({ summary: '获取用户导入模板（返回示例数据）' })
  getTemplate() {
    return [
      { username: '请输入用户名', realName: '请输入姓名', department: '请输入部门', phone: '请输入手机号', roleNames: '普通用户', password: '请填写密码' },
      { username: '请输入用户名', realName: '请输入姓名', department: '请输入部门', phone: '请输入手机号', roleNames: '普通用户', password: '请填写密码' },
    ];
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户（软删除）' })
  remove(@Param('id') id: number) {
    return this.userService.remove(id);
  }
}
