import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { ReportColumn } from './entities/report-column.entity';
import { ReportChart } from './entities/report-chart.entity';
import { ReportService } from './report.service';
import { ReportColumnService } from './report-column.service';
import { ReportChartService } from './report-chart.service';
import { ReportController } from './report.controller';
import { ReportColumnController, ReportChartController } from './report-config.controller';
import { CacheService } from '../common/cache.service';

/**
 * 清单配置模块 - 管理清单配置、字段配置、图表配置
 */
@Module({
  imports: [TypeOrmModule.forFeature([Report, ReportColumn, ReportChart])],
  controllers: [ReportController, ReportColumnController, ReportChartController],
  providers: [ReportService, ReportColumnService, ReportChartService, CacheService],
  exports: [ReportService, ReportColumnService, ReportChartService],
})
export class ReportModule {}