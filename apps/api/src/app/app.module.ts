import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SudokuModule } from './sudoku/sudoku.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'public')
    }),
    SudokuModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
