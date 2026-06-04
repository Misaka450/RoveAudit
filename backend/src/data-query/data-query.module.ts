import { Module } from '@nestjs/common';
import { ReportModule } from '../report/report.module';
import { DorisService } from './doris.service';
import { DataQueryService } from './data-query.service';
import { DataQueryController } from './data-query.controller';

/**
 * 数据查询模块 - 连接 Doris 执行业务数据查询
 */
@Module({
  imports: [ReportModule],
  controllers: [DataQueryController],
  providers: [DorisService, DataQueryService],
  exports: [DataQueryService, DorisService],
})
export class DataQueryModule {}