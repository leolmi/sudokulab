import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { OcrScanResult } from '@olmi/model';
import { SUDOKU_API } from '@olmi/common';
import { OcrDoubtsComponent, OcrMapWrapper } from '../ocr-doubts/ocr-doubts.component';

@Component({
  selector: 'ocr-image-map',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    OcrDoubtsComponent,
  ],
  templateUrl: './ocr-image-map.component.html',
  styleUrl: './ocr-image-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OcrImageMapComponent {
  private readonly _dialogRef = inject(MatDialogRef<OcrImageMapComponent>);
  private readonly _interaction = inject(SUDOKU_API);

  protected readonly data = inject<OcrScanResult>(MAT_DIALOG_DATA);
  protected readonly ocrMaps = signal<OcrMapWrapper[]>([]);
  protected readonly valid = signal<boolean>(false);

  async apply() {
    // const maps = this.ocrMaps();
    // for (const m of maps) {
    //   await firstValueFrom(this._interaction.ocrMap(<OcrScanMap>m));
    // }
    this._dialogRef.close();
  }
}
