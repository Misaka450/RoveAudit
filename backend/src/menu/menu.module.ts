import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from './entities/menu.entity';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';

/**
 * 菜单模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([Menu])],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}