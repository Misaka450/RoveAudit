import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
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
      isGlobal: true, // 全局模块，无需在每个模块重复导入
      envFilePath: '.env',
    }),

    // --- MySQL 系统数据库连接 ---
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
        entities: [__dirname + '/**/entities/*.entity{.ts,.js}'], // 自动扫描实体
        synchronize: false, // 生产环境关闭自动同步
        logging: false,
        timezone: '+08:00',
      }),
    }),

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
  ],
  controllers: [AppController],
})
export class AppModule {}