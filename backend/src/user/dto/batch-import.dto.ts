import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 批量导入用户-单行数据
 */
export class ImportUserRowDto {
  @ApiProperty({ description: '登录账号' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: '真实姓名' })
  @IsString()
  @IsNotEmpty()
  realName: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: '所属部门', required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: '角色名（逗号分隔）', required: false })
  @IsOptional()
  @IsString()
  roleNames?: string;
}

/**
 * 批量导入用户请求
 */
export class BatchImportDto {
  @ApiProperty({ description: '用户数据列表', type: [ImportUserRowDto] })
  rows: ImportUserRowDto[];
}