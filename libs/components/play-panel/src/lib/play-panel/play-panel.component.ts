import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { PlayCardComponent } from '../play-card/play-card.component';
import { SUDOKU_STORE, TranslateService } from '@olmi/common';
import { Algorithm } from '@olmi/model';
import { getAlgorithms } from '@olmi/algorithms';
import { MatMenuModule } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { PlayAction } from './play-panel.action';

@Component({
  selector: 'play-panel',
  standalone: true,
  imports: [PlayCardComponent, MatMenuModule, MatIcon],
  templateUrl: './play-panel.component.html',
  styleUrl: './play-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayPanelComponent {
  readonly store = inject(SUDOKU_STORE);
  readonly tr = inject(TranslateService);

  readonly schemasCount = computed<number>(() => this.store.catalog().length);

  // catalogo completo degli algoritmi (immutabile a runtime: snapshot al boot)
  readonly algorithms: Algorithm[] = getAlgorithms();

  readonly onAction = output<PlayAction>();

  onRandom() {
    this.onAction.emit({ kind: 'random' });
  }

  onHard() {
    this.onAction.emit({ kind: 'hard' });
  }

  onAlgorithmSelected(alg: Algorithm) {
    this.onAction.emit({ kind: 'with-algorithm', algorithmId: alg.id });
  }
}
