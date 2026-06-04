import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

/**
 * 认证模块 - 包含登录、JWT 签发与验证
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    // JWT 模块异步配置（从环境变量读取密钥和过期时间）
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'default-secret'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', '24h'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}