import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';

/**
 * 菜单管理控制器
 */
@ApiTags('菜单管理')
@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('tree')
  @ApiOperation({ summary: '获取当前登录用户的菜单树' })
  // 修复：去掉 @Public()，改为必须登录，按用户权限返回菜单
  findTree(@Req() req: any) {
    const userId = req.user?.userId;
    return this.menuService.findTree(userId);
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