import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AlgorithmResult, Sudoku, SudokuInfoEx } from '@olmi/model';
import { CdkFixedSizeVirtualScroll, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { isNumber as _isNumber } from 'lodash';
import { getAlgorithm } from '@olmi/algorithms';
import { MatIconModule } from '@angular/material/icon';

export class SolveToDialogArgs {
  schema?: Sudoku;
}

class AlgorithmResultEx extends AlgorithmResult {
  constructor(r?: Partial<AlgorithmResultEx>) {
    super(r);
    const alg = getAlgorithm(this.algorithm);
    this.description = alg?.name || alg?.id || 'unknown';
    this.icon = alg?.icon || '';
  }
  description: string;
  icon: string;
}

@Component({
  selector: 'solve-to-dialog',
  standalone: true,
  imports: [
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    CdkFixedSizeVirtualScroll,
    CdkVirtualScrollViewport,
  ],
  templateUrl: './solve-to-dialog.component.html',
  styleUrl: './solve-to-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolveToDialogComponent {
  private readonly _dialogRef = inject(MatDialogRef<SolveToDialogComponent>);
  private readonly _data = inject<SolveToDialogArgs>(MAT_DIALOG_DATA);

  protected readonly items = signal<AlgorithmResultEx[]>(
    ((<SudokuInfoEx>this._data.schema?.info)?.solution || []).map(r => new AlgorithmResultEx(r)),
  );
  protected readonly activeStep = signal<number | undefined>(undefined);

  clickOnItem(index: number) {
    this.activeStep.set(index);
  }

  select() {
    const step = this.activeStep();
    if (_isNumber(step)) this._dialogRef.close(step + 1);
  }
}
