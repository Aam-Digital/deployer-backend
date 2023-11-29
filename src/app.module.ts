import {
  HttpException,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry';
import { SeverityLevel } from '@sentry/types';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { setUser } from '@sentry/node';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { HttpModule } from '@nestjs/axios';

const lowSeverityLevels: SeverityLevel[] = ['log', 'info'];

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory: () =>
        new SentryInterceptor({
          filters: [
            {
              type: HttpException,
              filter: (exception: HttpException) => 500 > exception.getStatus(), // Only report 500 errors
            },
          ],
        }),
    },
  ],
  imports: [
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SentryModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        if (!configService.get('SENTRY_DSN')) {
          return;
        }

        return {
          dsn: configService.get('SENTRY_DSN'),
          debug: true,
          environment: 'prod',
          release: 'deployer-backend@' + process.env.npm_package_version,
          whitelistUrls: [/https?:\/\/(.*)\.?aam-digital\.com/],
          initialScope: {
            tags: {
              // ID of the docker container in which this is run
              hostname: process.env.HOSTNAME || 'unknown',
            },
          },
          beforeSend: (event) => {
            if (lowSeverityLevels.includes(event.level)) {
              return null;
            } else {
              return event;
            }
          },
        };
      },
    }),
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req, res, next) => {
        // reset user before processing a request
        setUser({ username: 'unknown' });
        next();
      })
      .forRoutes('*');
  }
}
