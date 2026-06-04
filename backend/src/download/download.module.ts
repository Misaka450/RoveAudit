import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataQueryModule } from '../data-query/data-query.module';
import { ReportModule } from '../report/report.module';
import { DownloadLog } from './entities/download-log.entity';
import { DownloadService } from './download.service';
import { DownloadController } from './download.controller';

/**
 * 下载模块 - Excel / CSV 文件导出
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DownloadLog]),
    DataQueryModule,
    ReportModule,
    // JWT 模块（用于下载时从 query 参数验证 token）
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'default-secret'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '24h') },
      }),
    }),
  ],
  controllers: [DownloadController],
  providers: [DownloadService],
})
export class DownloadModule {}