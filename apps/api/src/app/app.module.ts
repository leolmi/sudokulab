import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SudokuModule } from './sudoku/sudoku.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { environment } from '../environments/environment';

const rootPath = environment.production ? './' : join(__dirname, 'public');

@Module({
  imports: [
    ServeStaticModule.forRoot({ rootPath }),
    SudokuModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
