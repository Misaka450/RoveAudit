import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarningRule } from './entities/warning-rule.entity';
import { WarningService } from './warning.service';
import { WarningController } from './warning.controller';
import { DataQueryModule } from '../data-query/data-query.module';

/**
 * 异常规则模块 - 异常规则 CRUD + 定时检测
 */
@Module({
  imports: [TypeOrmModule.forFeature([WarningRule]), DataQueryModule],
  controllers: [WarningController],
  providers: [WarningService],
  exports: [WarningService],
})
export class WarningModule {}