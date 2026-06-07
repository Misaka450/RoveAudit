import { Module } from '@nestjs/common';
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
  ],
  controllers: [DownloadController],
  providers: [DownloadService],
})
export class DownloadModule {}