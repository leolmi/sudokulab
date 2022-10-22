import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import {json, urlencoded} from 'express';
import {DEFAULT_API_PORT, DEFAULT_CONTEXT, DEFAULT_REQUEST_LIMIT} from "./model/consts";

//CORS middleware
// const allowCrossDomain = (req, res, next?: () => void) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   next();
// };

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: !process.env.DISABLED_CORS });
  const context = DEFAULT_CONTEXT;
  app.setGlobalPrefix(context);
  app.use(json({limit: DEFAULT_REQUEST_LIMIT}));
  app.use(urlencoded({extended: true, limit: DEFAULT_REQUEST_LIMIT}));
  //if (!process.env.ENABLED_CORS) app.use(allowCrossDomain);
  const port = process.env.PORT || DEFAULT_API_PORT;
  const message = environment.production ? `Server started` : `Listening at http://localhost:${port}/${context}`;
  await app.listen(port, () => Logger.log(message));
}

bootstrap();
