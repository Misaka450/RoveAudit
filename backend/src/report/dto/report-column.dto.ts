import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 清单字段配置项
 */
export class ReportColumnItemDto {
  @ApiProperty({ description: '字段名（对应数据中的列名）' })
  @IsString()
  @IsNotEmpty()
  fieldName: string;

  @ApiProperty({ description: '显示名称' })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({ description: '是否可见', default: true })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @ApiProperty({ description: '排序号', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ description: '宽度（px）', required: false })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiProperty({ description: '对齐方式：left/center/right', default: 'left' })
  @IsOptional()
  @IsString()
  align?: string;
}

/**
 * 保存清单字段配置请求
 */
export class SaveReportColumnsDto {
  @ApiProperty({ description: '清单编码' })
  @IsString()
  @IsNotEmpty()
  reportCode: string;

  @ApiProperty({ description: '字段配置列表', type: [ReportColumnItemDto] })
  @IsArray()
  columns: ReportColumnItemDto[];
}