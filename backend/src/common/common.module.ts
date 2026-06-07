import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { NotificationService } from './notification.service';

/**
 * 全局公共模块 - 提供 CacheService 和 NotificationService 单例
 */
@Global()
@Module({
  providers: [
    {
      provide: CacheService,
      useFactory: () => new CacheService(500),
    },
    NotificationService,
  ],
  exports: [CacheService, NotificationService],
})
export class CommonModule {}
