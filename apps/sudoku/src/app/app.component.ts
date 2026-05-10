import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MenuItem, SUDOKU_AUTHOR_LINK } from '@olmi/model';
import { SUDOKU_PAGE_PLAYER_LOGIC } from './pages';
import { LayoutModule } from '@angular/cdk/layout';
import {
  I18nMatTooltipDirective,
  ServerWaiterComponent,
  SUDOKU_STATE,
  SUDOKU_STORE,
  SudokuState,
  TranslateService,
} from '@olmi/common';


@Component({
  imports: [
    LayoutModule,
    NgClass,
    RouterModule,
    MatToolbarModule,
    MatMenuModule,
    MatTooltipModule,
    MatIcon,
    MatIconButton,
    ServerWaiterComponent,
    I18nMatTooltipDirective,
  ],
  selector: 'app-root',
  templateUrl: '/app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly state = inject(SUDOKU_STATE);
  readonly store = inject(SUDOKU_STORE);
  readonly tr = inject(TranslateService);
  readonly globalState = SudokuState;

  readonly pageSubMenu = signal<MenuItem[]>([]);

  constructor() {
    const _logic = inject(SUDOKU_PAGE_PLAYER_LOGIC);
    this.store.init(_logic);
  }

  clickOnLogo = () => window.open(SUDOKU_AUTHOR_LINK, "_blank");
  buildSubMenu = (item: MenuItem) => this.pageSubMenu.set(item.subMenu || []);
  toggleLang = () => this.tr.toggle();
}
