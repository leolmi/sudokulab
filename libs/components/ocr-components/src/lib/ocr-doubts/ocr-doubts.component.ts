import { ChangeDetectionStrategy, Component, effect, input, linkedSignal, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { OcrScanDoubt } from '@olmi/model';

export interface OcrMapWrapper {
  text: string;
  src: string;
  map: string;
}

@Component({
  selector: 'ocr-doubts',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './ocr-doubts.component.html',
  styleUrl: './ocr-doubts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OcrDoubtsComponent {
  readonly ocrMaps = input<OcrScanDoubt[] | null | undefined>();

  readonly isValid = output<boolean>();
  readonly doubts = output<OcrMapWrapper[]>();

  // stato locale derivato dall'input: parte dai doubts in ingresso e si lascia
  // mutare da `applyChar` quando l'utente compila i caratteri ambigui.
  protected readonly maps = linkedSignal<OcrMapWrapper[]>(() => getMaps(this.ocrMaps() || []));

  constructor() {
    effect(() => {
      const maps = this.maps();
      const valid = maps.length > 0 && !maps.some(o => !o.text);
      this.isValid.emit(valid);
      if (valid) this.doubts.emit(maps);
    });
  }

  applyChar(e: Event, omw: OcrMapWrapper) {
    const value = (e.target as HTMLInputElement).value || '';
    this.maps.update(ms => ms.map(m => m.src === omw.src ? { ...m, text: value } : m));
  }
}

const getMaps = (ds: OcrScanDoubt[]): OcrMapWrapper[] =>
  ds.map(d => ({ src: d.image || '', text: '', map: d.map || '' }));
