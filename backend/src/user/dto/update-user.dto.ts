import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 更新用户请求参数
 */
export class UpdateUserDto {
  @ApiProperty({ description: '真实姓名', required: false })
  @IsOptional()
  @IsString()
  realName?: string;

  @ApiProperty({ description: '所属部门', required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: '状态：1-启用 0-禁用', required: false })
  @IsOptional()
  status?: number;

  @ApiProperty({ description: '角色ID列表', type: [Number], required: false })
  @IsOptional()
  @IsArray()
  roleIds?: number[];
}