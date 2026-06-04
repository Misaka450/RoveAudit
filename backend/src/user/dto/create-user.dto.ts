import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建用户请求参数
 */
export class CreateUserDto {
  @ApiProperty({ description: '登录账号' })
  @IsString()
  @IsNotEmpty({ message: '账号不能为空' })
  username: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;

  @ApiProperty({ description: '真实姓名' })
  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  realName: string;

  @ApiProperty({ description: '所属部门', required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: '角色ID列表', type: [Number], required: false })
  @IsOptional()
  roleIds?: number[];
}