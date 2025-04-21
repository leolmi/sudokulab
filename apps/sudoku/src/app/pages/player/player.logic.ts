import { InjectionToken } from '@angular/core';
import { LogicExecutor } from '@olmi/model';

export const SUDOKU_PAGE_PLAYER_LOGIC = new InjectionToken<LogicExecutor>('SUDOKU_PAGE_PLAYER_LOGIC');
