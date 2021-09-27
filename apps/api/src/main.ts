import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3333;
  const message = environment.production ? `Server started` : `Listening at http://localhost:${port}/${globalPrefix}`;
  await app.listen(port, () => {
    Logger.log(message);
  });
}

bootstrap();
