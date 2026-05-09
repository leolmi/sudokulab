import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';


interface PickerSegment {
  index: number;
  value: string;
  label: string;
  path: string;
  labelX: number;
  labelY: number;
}

@Component({
  selector: 'cell-radial-picker',
  imports: [],
  templateUrl: './cell-radial-picker.component.html',
  styleUrl: './cell-radial-picker.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CellRadialPickerComponent {
  // viewBox è in unità logiche; la SVG viene scalata in pixel via [style.width]
  readonly viewSize = 100;
  readonly viewCenter = 50;
  readonly innerRadius = 13;
  readonly outerRadius = 48;

  readonly values = input<string[] | null | undefined>([]);
  // indice del segmento sotto il pointer (-1 = dead-zone / nessuno)
  readonly hoveredIndex = input<number>(-1);
  // posizione del centro in pixel relativi al contenitore overlay
  readonly centerX = input<number>(0);
  readonly centerY = input<number>(0);
  // raggio in pixel
  readonly radius = input<number>(100);

  readonly segments = computed<PickerSegment[]>(() => this._computeSegments(this.values() || []));

  readonly previewLabel = computed<string>(() => {
    const idx = this.hoveredIndex();
    const vals = this.values() || [];
    if (idx < 0 || idx >= vals.length) return '';
    return this._labelOf(vals[idx]);
  });

  private _computeSegments(values: string[]): PickerSegment[] {
    const n = values.length;
    if (n === 0) return [];
    const slice = (Math.PI * 2) / n;
    // primo segmento centrato sul nord (12 in punto)
    const start = -Math.PI / 2 - slice / 2;
    const labelR = (this.innerRadius + this.outerRadius) / 2;
    return values.map((value, i) => {
      const a0 = start + i * slice;
      const a1 = a0 + slice;
      const aMid = (a0 + a1) / 2;
      return {
        index: i,
        value,
        label: this._labelOf(value),
        path: this._slicePath(this.viewCenter, this.viewCenter, this.innerRadius, this.outerRadius, a0, a1),
        labelX: this.viewCenter + labelR * Math.cos(aMid),
        labelY: this.viewCenter + labelR * Math.sin(aMid),
      };
    });
  }

  private _labelOf(value: string): string {
    if (value === '') return '×';
    return value;
  }

  private _slicePath(cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number): string {
    const x1 = cx + rOut * Math.cos(a0);
    const y1 = cy + rOut * Math.sin(a0);
    const x2 = cx + rOut * Math.cos(a1);
    const y2 = cy + rOut * Math.sin(a1);
    const x3 = cx + rIn * Math.cos(a1);
    const y3 = cy + rIn * Math.sin(a1);
    const x4 = cx + rIn * Math.cos(a0);
    const y4 = cy + rIn * Math.sin(a0);
    const largeArc = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  }
}
