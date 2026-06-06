import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { CacheService } from './common/cache.service';
import { NotificationService } from './common/notification.service';
import { AuditLogModule } from './common/audit-log.module';
import { AuditMiddleware } from './common/middleware/audit.middleware';
// 业务模块
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { MenuModule } from './menu/menu.module';
import { ReportModule } from './report/report.module';
import { DataQueryModule } from './data-query/data-query.module';
import { DownloadModule } from './download/download.module';
import { WarningModule } from './warning/warning.module';

/**
 * 应用根模块 - 组装所有子模块和全局配置
 */
@Module({
  imports: [
    // --- 环境变量配置（全局可用）---
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // --- PostgreSQL 系统数据库连接 ---
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('PG_HOST', 'localhost'),
        port: config.get('PG_PORT', 5432),
        username: config.get('PG_USER', 'postgres'),
        password: config.get('PG_PASSWORD', '123456'),
        database: config.get('PG_DATABASE', 'data_portal'),
        entities: [__dirname + '/**/entities/*.entity{.ts,.js}'],
        synchronize: false,
        logging: false,
      }),
    }),

    // --- 请求限流（防刷接口）---
    ThrottlerModule.forRoot([{
      ttl: 60000,    // 每分钟
      limit: 120,    // 最多 120 次请求（平均每秒2次）
    }]),

    // --- 定时任务模块 ---
    ScheduleModule.forRoot(),

    // --- 业务模块 ---
    AuthModule,
    UserModule,
    RoleModule,
    MenuModule,
    ReportModule,
    DataQueryModule,
    DownloadModule,
    WarningModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [
    // 全局服务（各模块可注入使用）
    CacheService,
    NotificationService,
    // 全局限流守卫
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditMiddleware).forRoutes('*');
  }
}