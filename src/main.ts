import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';

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
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    debug: false,
    environment: 'production',
    release: 'deployer-backend@' + process.env.npm_package_version,
    initialScope: {
      tags: {
        // ID of the docker container in which this is run
        hostname: process.env.HOSTNAME || 'unknown',
      },
    },
  });

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
