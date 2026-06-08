import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 图表配置项
 */
export class ReportChartDto {
  @ApiProperty({ description: '关联的清单编码' })
  @IsString()
  reportCode: string;

  @ApiProperty({ description: '图表类型：bar/line/pie', default: 'bar' })
  @IsOptional()
  @IsString()
  chartType?: string;

  @ApiProperty({ description: '图表标题', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'X轴字段' })
  @IsString()
  xField: string;

  @ApiProperty({ description: 'Y轴字段(们)', required: false })
  @IsOptional()
  yFields?: string[];

  @ApiProperty({ description: '排序号', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ description: '额外配置（JSON）', required: false })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}