import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { urlencoded, json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  const port = process.env.PORT || 3333;
  const message = environment.production ? `Server started` : `Listening at http://localhost:${port}/${globalPrefix}`;
  await app.listen(port, () => {
    Logger.log(message);
  });
}

bootstrap();
