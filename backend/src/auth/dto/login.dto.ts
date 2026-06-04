import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 登录请求参数
 */
export class LoginDto {
  @ApiProperty({ description: '用户账号', example: 'admin' })
  @IsString({ message: '账号必须是字符串' })
  @IsNotEmpty({ message: '账号不能为空' })
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}