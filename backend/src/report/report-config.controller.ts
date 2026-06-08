import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportColumnService } from './report-column.service';
import { ReportChartService } from './report-chart.service';
import { SaveReportColumnsDto, ReportColumnItemDto } from './dto/report-column.dto';
import { ReportChartDto } from './dto/report-chart.dto';

/**
 * 清单字段配置控制器 - 管理每列的展示属性
 */
@ApiTags('清单字段配置')
@Controller('report-columns')
export class ReportColumnController {
  constructor(private readonly columnService: ReportColumnService) {}

  @Get(':reportCode')
  @ApiOperation({ summary: '获取清单字段配置' })
  findByReportCode(@Param('reportCode') reportCode: string) {
    return this.columnService.findByReportCode(reportCode);
  }

  @Put(':reportCode')
  @ApiOperation({ summary: '批量保存字段配置' })
  saveColumns(
    @Param('reportCode') reportCode: string,
    @Body() columns: any[],
  ) {
    return this.columnService.saveColumns(reportCode, columns);
  }
}

/**
 * 清单图表配置控制器 - 管理图表分析配置
 */
@ApiTags('清单图表配置')
@Controller('report-charts')
export class ReportChartController {
  constructor(private readonly chartService: ReportChartService) {}

  @Get()
  @ApiOperation({ summary: '获取所有图表配置' })
  findAll() {
    return this.chartService.findAll();
  }

  @Get(':reportCode')
  @ApiOperation({ summary: '获取清单的图表配置' })
  findByReportCode(@Param('reportCode') reportCode: string) {
    return this.chartService.findByReportCode(reportCode);
  }

  @Post()
  @ApiOperation({ summary: '创建图表配置' })
  create(@Body() dto: ReportChartDto) {
    return this.chartService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新图表配置' })
  update(@Param('id') id: number, @Body() dto: Partial<ReportChartDto>) {
    return this.chartService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除图表配置' })
  remove(@Param('id') id: number) {
    return this.chartService.remove(id);
  }
}