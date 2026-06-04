import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

/**
 * 清单配置模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([Report])],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}