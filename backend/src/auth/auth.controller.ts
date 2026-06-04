import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';

/**
 * 认证控制器 - 登录接口
 */
@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录 - 返回 JWT Token 和用户信息
   */
  @Post('login')
  @Public() // 登录接口不需要认证
  @ApiOperation({ summary: '用户登录' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}