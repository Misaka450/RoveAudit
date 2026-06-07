import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WarningService } from './warning.service';
import { CreateWarningRuleDto } from '../common/dto/create.dto';

/**
 * 异常规则管理控制器
 */
@ApiTags('异常规则')
@Controller('warnings')
export class WarningController {
  constructor(private readonly warningService: WarningService) {}

  @Get('rules')
  @ApiOperation({ summary: '查询所有异常规则' })
  findAll() {
    return this.warningService.findAll();
  }

  @Get('rules/:id')
  @ApiOperation({ summary: '查询异常规则详情' })
  findOne(@Param('id') id: number) {
    return this.warningService.findOne(id);
  }

  @Post('rules')
  @ApiOperation({ summary: '创建异常规则' })
  create(@Body() data: CreateWarningRuleDto) {
    return this.warningService.create(data);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: '更新异常规则' })
  update(@Param('id') id: number, @Body() data: Partial<CreateWarningRuleDto>) {
    return this.warningService.update(id, data);
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: '删除异常规则' })
  remove(@Param('id') id: number) {
    return this.warningService.remove(id);
  }

  @Post('rules/:id/execute')
  @ApiOperation({ summary: '手动执行单条异常规则' })
  executeRule(@Param('id') id: number) {
    return this.warningService.executeRule(id);
  }

  @Post('execute-all')
  @ApiOperation({ summary: '手动执行所有已启用的异常规则' })
  executeAll() {
    return this.warningService.executeAllRules();
  }

  @Get('results')
  @ApiOperation({ summary: '获取异常检测结果汇总' })
  async getResults() {
    const rules = await this.warningService.findEnabled();
    return rules.map((r) => ({
      id: r.id,
      ruleName: r.ruleName,
      ruleType: r.ruleType,
      riskLevel: r.riskLevel,
      lastRunTime: r.lastRunTime,
      lastResultCount: r.lastResultCount,
    }));
  }

  @Get('trend')
  @ApiOperation({ summary: '获取异常趋势数据（按天统计各风险等级）' })
  getTrend(@Query('days') days?: number) {
    return this.warningService.getTrendData(days || 30);
  }

  @Get('distribution')
  @ApiOperation({ summary: '获取异常类型占比分布' })
  getDistribution() {
    return this.warningService.getTypeDistribution();
  }
}