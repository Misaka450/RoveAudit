import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { NotificationService } from './notification.service';
import { TokenBlacklistService } from './token-blacklist.service';

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
    TokenBlacklistService,
  ],
  exports: [CacheService, NotificationService, TokenBlacklistService],
})
export class CommonModule {}
