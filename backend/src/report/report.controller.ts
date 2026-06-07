import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { CreateReportDto, UpdateReportDto } from '../common/dto/create.dto';

/**
 * 清单配置管理控制器
 */
@ApiTags('清单配置')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('categories')
  @ApiOperation({ summary: '获取所有清单分类' })
  getCategories() {
    return this.reportService.getCategories();
  }

  @Get()
  @ApiOperation({ summary: '查询清单列表（管理页面）' })
  findAllAdmin(@Query('keyword') keyword?: string) {
    return this.reportService.findAllAdmin(keyword);
  }

  @Get('list')
  @ApiOperation({ summary: '查询启用的清单列表（清单中心展示）' })
  findAll(@Query('category') category?: string) {
    return this.reportService.findAll(category);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询清单详情' })
  findOne(@Param('id') id: number) {
    return this.reportService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建清单配置' })
  create(@Body() data: CreateReportDto) {
    return this.reportService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新清单配置' })
  update(@Param('id') id: number, @Body() data: UpdateReportDto) {
    return this.reportService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除清单配置' })
  remove(@Param('id') id: number) {
    return this.reportService.remove(id);
  }
}