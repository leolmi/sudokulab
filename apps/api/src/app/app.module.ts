import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { SudokuModule } from './sudoku/sudoku.module';
import { AppLoggerMiddleware } from './app.logger';

@Module({
  imports: [
    ServeStaticModule.forRoot({ rootPath: join(__dirname, 'public/browser') }),
    SudokuModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(AppLoggerMiddleware).forRoutes('/*path');
  }
}
