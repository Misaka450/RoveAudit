import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ description: '清单编码' })
  @IsString()
  @IsNotEmpty({ message: '编码不能为空' })
  reportCode: string;

  @ApiProperty({ description: '清单名称' })
  @IsString()
  @IsNotEmpty({ message: '名称不能为空' })
  reportName: string;

  @ApiProperty({ description: '分类', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'SQL模板', required: false })
  @IsOptional()
  @IsString()
  sqlContent?: string;

  @ApiProperty({ description: '排序号', required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateReportDto {
  @ApiProperty({ description: '清单名称', required: false })
  @IsOptional()
  @IsString()
  reportName?: string;

  @ApiProperty({ description: '分类', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'SQL模板', required: false })
  @IsOptional()
  @IsString()
  sqlContent?: string;

  @ApiProperty({ description: '排序号', required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ description: '状态：1-启用 0-禁用', required: false })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}
