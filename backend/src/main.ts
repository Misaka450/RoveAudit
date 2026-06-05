import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DorisService } from './data-query/doris.service';

const logger = new Logger('Bootstrap');

/**
 * 运营商数据门户平台 - 应用启动入口
 */
async function bootstrap() {
  // 创建 NestJS 应用实例
  const app = await NestFactory.create(AppModule);

  // 全局路由前缀
  app.setGlobalPrefix('api');

  // 全局参数验证管道（自动校验DTO）
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // 自动删除非装饰器声明的属性
      transform: true,        // 自动转换类型
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 注册全局守卫（JWT认证 + 权限校验）
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);
  app.useGlobalGuards(
    new JwtAuthGuard(jwtService, reflector),
    new PermissionGuard(reflector),
  );

  // 注册全局异常过滤器（统一错误响应格式）
  app.useGlobalFilters(new AllExceptionsFilter());

  // 注册全局响应拦截器（统一成功响应格式）
  app.useGlobalInterceptors(new TransformInterceptor());

  // 允许跨域（前端可能运行在不同端口）
  app.enableCors();

  // 配置 Swagger API 文档
  const config = new DocumentBuilder()
    .setTitle('运营商数据门户平台 API')
    .setDescription('Data Portal - 数据清单查询、下载、分析服务')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 启动服务
  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  logger.log(`服务已启动: http://localhost:${port}`);
  logger.log(`Swagger 文档: http://localhost:${port}/api-docs`);

  // Doris 连接健康检测（异步，不阻塞启动）
  try {
    const dorisService = app.get(DorisService);
    await dorisService.healthCheck();
  } catch (err) {
    logger.warn(`Doris 连接检测失败: ${err.message}，服务仍可启动，请检查 Doris 配置`);
  }
}
bootstrap();