import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppStateService } from './app-state.service';
import { StatusController } from './status.controller';
import { BusyGuard } from './busy.guard';

/**
 * Stato operativo del server + endpoint di polling + guard globale.
 * `@Global()` per evitare di doverlo reimportare in ogni modulo che
 * voglia iniettare `AppStateService` (es. SudokuModule).
 */
@Global()
@Module({
  controllers: [StatusController],
  providers: [
    AppStateService,
    { provide: APP_GUARD, useClass: BusyGuard },
  ],
  exports: [AppStateService],
})
export class StatusModule {}
