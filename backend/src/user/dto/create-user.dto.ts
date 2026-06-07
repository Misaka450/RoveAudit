import { IsString, IsNotEmpty, IsOptional, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建用户请求参数
 */
export class CreateUserDto {
  @ApiProperty({ description: '登录账号' })
  @IsString()
  @IsNotEmpty({ message: '账号不能为空' })
  username: string;

  @ApiProperty({ description: '密码（至少8位，需包含大小写字母和数字）' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(8, { message: '密码长度不能少于8位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: '密码必须包含大写字母、小写字母和数字',
  })
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