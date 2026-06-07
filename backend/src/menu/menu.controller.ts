import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { Public } from '../common/decorators/public.decorator';
import { CreateMenuDto } from './dto/create-menu.dto';

/**
 * 菜单管理控制器
 */
@ApiTags('菜单管理')
@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('tree')
  @Public() // 前端获取菜单树不需要额外权限（JWT已包含菜单信息）
  @ApiOperation({ summary: '获取菜单树（根据登录用户权限返回）' })
  findTree() {
    return this.menuService.findTree();
  }

  @Get()
  @ApiOperation({ summary: '查询菜单列表（平铺）' })
  findAll() {
    return this.menuService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '查询菜单详情' })
  findOne(@Param('id') id: number) {
    return this.menuService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建菜单' })
  create(@Body() data: CreateMenuDto) {
    return this.menuService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新菜单' })
  update(@Param('id') id: number, @Body() data: Partial<CreateMenuDto>) {
    return this.menuService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除菜单' })
  remove(@Param('id') id: number) {
    return this.menuService.remove(id);
  }
}