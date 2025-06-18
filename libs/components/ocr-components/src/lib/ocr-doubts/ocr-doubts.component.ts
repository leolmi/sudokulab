import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, map } from 'rxjs';
import { FlexModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { OcrScanDoubt } from '@olmi/model';
import { cloneDeep as _clone } from 'lodash';

export interface OcrMapWrapper {
  text: string;
  src: string;
  map: string;
}

@Component({
  selector: 'ocr-doubts',
  imports: [
    CommonModule,
    FlexModule,
    MatButtonModule,
  ],
  templateUrl: './ocr-doubts.component.html',
  styleUrl: './ocr-doubts.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OcrDoubtsComponent {
  ocrMaps$: BehaviorSubject<OcrMapWrapper[]>;

  @Input()
  set ocrMaps(ds: OcrScanDoubt[]|null|undefined) {
    this.ocrMaps$.next(getMaps(ds||[]));
  }

  @Output()
  isValid: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output()
  doubts: EventEmitter<OcrMapWrapper[]> = new EventEmitter<OcrMapWrapper[]>();

  constructor() {
    this.ocrMaps$ = new BehaviorSubject<OcrMapWrapper[]>([]);

    this.ocrMaps$
      .pipe(map(oms => oms.length>0 && !oms.find(o => !o.text)))
      .subscribe(valid => {
        this.isValid.emit(valid);
        if (valid) this.doubts.emit(this.ocrMaps$.value);
      });
  }

  applyChar(e: any, omw: OcrMapWrapper) {
    const ms = _clone(this.ocrMaps$.value);
    const omwc = ms.find(m => m.src === omw.src);
    if (omwc) {
      omwc.text = e.target.value||'';
      this.ocrMaps$.next(ms);
    }
  }
}

const getMaps = (ds: OcrScanDoubt[]): OcrMapWrapper[] => {
  return ds.map(d => {
    return <OcrMapWrapper>{
      src: d.image||'',
      text: '',
      map: d.map||''
    };
  });
}
