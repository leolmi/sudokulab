import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { StepViewerItem } from './step-viewer.model';
import { AlgorithmResult } from '@olmi/model';
import { getItems } from './step-viewer.logic';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ALGORITHM_INFO_DIALOG_CONFIG, AlgorithmInfoDialogComponent } from '@olmi/algorithm-info';

@Component({
  selector: 'step-viewer',
  imports: [
    MatIcon,
    MatIconButton,
    MatTooltipModule,
  ],
  templateUrl: './step-viewer.component.html',
  styleUrl: './step-viewer.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepViewerComponent {
  private readonly _dialog = inject(MatDialog);

  readonly sequence = input<AlgorithmResult[] | null | undefined>(undefined);
  readonly autoHeight = input<boolean>(false);

  readonly onClickItem = output<StepViewerItem>();
  readonly onApplyItem = output<AlgorithmResult>();

  readonly items = computed<StepViewerItem[]>(() => getItems(this.sequence() || []));

  // linkedSignal: si resettano automaticamente quando `items` cambia (cioè
  // all'arrivo di un nuovo `sequence`), ma sono scrivibili imperativamente
  // dalle interazioni utente
  readonly clicked = linkedSignal<StepViewerItem[], Record<string, boolean>>({
    source: () => this.items(),
    computation: () => ({}),
  });
  readonly selected = linkedSignal<StepViewerItem[], string>({
    source: () => this.items(),
    computation: () => '',
  });
  readonly appliedIndex = linkedSignal<StepViewerItem[], number>({
    source: () => this.items(),
    computation: (items) => items.length - 1,
  });

  clickOnItem(item: StepViewerItem) {
    if (item.groupTitle) return;
    this.clicked.update(c => ({ ...c, [item.id]: true }));
    this.selected.set(item?.id || '');
    this.onClickItem.emit(item);
  }

  applyStep(index: number) {
    this.appliedIndex.set(index);
    const item = this.items()[index];
    if (item?.result) this.onApplyItem.emit(item.result);
  }

  openAlgorithmInfo(algorithmId: string, ev?: Event) {
    ev?.stopPropagation();
    if (!algorithmId) return;
    this._dialog.open(AlgorithmInfoDialogComponent, {
      ...ALGORITHM_INFO_DIALOG_CONFIG,
      data: { algorithmId },
    });
  }
}
