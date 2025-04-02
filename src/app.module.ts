import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { setUser } from '@sentry/node';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { HttpModule } from '@nestjs/axios';
import { SentryModule } from '@sentry/nestjs/setup';

@Module({
  providers: [],
  imports: [
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SentryModule.forRoot(),
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
