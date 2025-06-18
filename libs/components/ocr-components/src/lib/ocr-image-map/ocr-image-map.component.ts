import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { FlexModule } from '@angular/flex-layout';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { OcrScanMap, OcrScanResult } from '@olmi/model';
import { SUDOKU_API } from '@olmi/common';
import { OcrDoubtsComponent, OcrMapWrapper } from '../ocr-doubts/ocr-doubts.component';


@Component({
  selector: 'ocr-image-map',
  imports: [
    CommonModule,
    FlexModule,
    MatDialogModule,
    MatButtonModule,
    OcrDoubtsComponent
  ],
  templateUrl: './ocr-image-map.component.html',
  styleUrl: './ocr-image-map.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OcrImageMapComponent {
  private readonly _dialogRef = inject(MatDialogRef<OcrImageMapComponent>);
  private readonly _interaction = inject(SUDOKU_API);
  readonly data = <OcrScanResult>inject(MAT_DIALOG_DATA);
  ocrMaps$: BehaviorSubject<OcrMapWrapper[]>;
  valid$: BehaviorSubject<boolean>;

  constructor() {
    this.valid$ = new BehaviorSubject<boolean>(false);
    this.ocrMaps$ = new BehaviorSubject<OcrMapWrapper[]>([]);
  }

  async apply() {
    const maps = this.ocrMaps$.value;
    for (const m of maps) {
      await firstValueFrom(this._interaction.ocrMap(<OcrScanMap>m));
    }
    this._dialogRef.close();
  }
}
