import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MenuItem, SUDOKU_AUTHOR_LINK } from '@olmi/model';
import { BehaviorSubject } from 'rxjs';
import { SUDOKU_PAGE_PLAYER_LOGIC } from './pages';
import { LayoutModule } from '@angular/cdk/layout';
import { SUDOKU_STATE, SUDOKU_STORE, SudokuState } from '@olmi/common';


@Component({
  imports: [
    CommonModule,
    LayoutModule,
    RouterModule,
    FlexLayoutModule,
    MatToolbarModule,
    MatMenuModule,
    MatTooltipModule,
    MatIcon,
    MatIconButton,
  ],
  selector: 'app-root',
  templateUrl: '/app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  state = inject(SUDOKU_STATE);
  store = inject(SUDOKU_STORE);
  globalState = SudokuState;

  pageSubMenu$: BehaviorSubject<MenuItem[]>;

  constructor() {
    this.pageSubMenu$ = new BehaviorSubject<MenuItem[]>([]);
    const _logic = inject(SUDOKU_PAGE_PLAYER_LOGIC);
    this.store.init(_logic);
  }

  clickOnLogo = () => window.open(SUDOKU_AUTHOR_LINK, "_blank");
  buildSubMenu = (item: MenuItem) => this.pageSubMenu$.next(item.subMenu || []);
}
