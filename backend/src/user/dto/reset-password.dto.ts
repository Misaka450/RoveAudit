import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 重置密码请求参数
 * 安全要求：密码至少 8 位，且同时包含大小写字母和数字
 */
export class ResetPasswordDto {
  @ApiProperty({ description: '新密码（至少8位，需包含大小写字母和数字）' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(8, { message: '密码长度不能少于 8 位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: '密码必须包含大写字母、小写字母和数字',
  })
  password: string;
}
