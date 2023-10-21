import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SentryService } from '@ntegral/nestjs-sentry';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // SwaggerUI setup see https://docs.nestjs.com/openapi/introduction#bootstrap
  const config = new DocumentBuilder()
    .setTitle(process.env.npm_package_name)
    .setDescription(process.env.npm_package_description)
    .setVersion(process.env.npm_package_version)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Logging everything through sentry
  app.useLogger(SentryService.SentryServiceInstance());

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
