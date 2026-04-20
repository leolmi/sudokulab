import { Controller, Get } from '@nestjs/common';
import { AppState, AppStateService } from './app-state.service';

/**
 * Endpoint leggero sempre disponibile che permette al client di pollare
 * lo stato del server durante i task lunghi (`busy`).
 */
@Controller('status')
export class StatusController {
  constructor(private readonly appState: AppStateService) {}

  @Get()
  getStatus(): AppState {
    return this.appState.getState();
  }
}
