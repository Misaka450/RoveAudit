import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWarningRuleDto {
  @ApiProperty({ description: '规则名称' })
  @IsString()
  @IsNotEmpty({ message: '规则名称不能为空' })
  ruleName: string;

  @ApiProperty({ description: '规则类型' })
  @IsString()
  @IsNotEmpty({ message: '规则类型不能为空' })
  ruleType: string;

  @ApiProperty({ description: '检测SQL' })
  @IsString()
  @IsNotEmpty({ message: 'SQL内容不能为空' })
  sqlContent: string;

  @ApiProperty({ description: '风险等级：high/medium/low', required: false })
  @IsOptional()
  @IsString()
  riskLevel?: string;
}
