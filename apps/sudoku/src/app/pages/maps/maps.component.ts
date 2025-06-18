import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PageBase } from '../../model/page.base';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { forEach as _forEach, forEachRight as _forEachRight } from 'lodash';
import { handleUpdate, isSchemaString, MenuItem, NotificationType } from '@olmi/model';
import { defaultHandleMenuItem } from '../pages.helper';
import { MAPS_MENU_CODES } from './maps.menu';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatButton } from '@angular/material/button';
import { OcrImageMapComponent } from '@olmi/ocr-components';


class GridCell {
  id: number = 0;
  size: number = 0;
  x: number = 0;
  y: number = 0;
  posX: number = 0;
  posY: number = 0;
  active: boolean = false;
}

@Component({
  imports: [
    CommonModule,
    FormsModule,
    FlexLayoutModule,
    MatSlider,
    MatSliderThumb,
    ReactiveFormsModule,
    MatButton
  ],
  selector: 'sudoku-maps',
  templateUrl: './maps.component.html',
  styleUrl: './maps.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapsComponent extends PageBase {
  private readonly _clipboard = inject(Clipboard);

  gridSize$: BehaviorSubject<number>;
  cells$: BehaviorSubject<GridCell[]>;
  char$: BehaviorSubject<string>;
  activeCell$: BehaviorSubject<GridCell|undefined>;

  constructor() {
    super();
    this.gridSize$ = new BehaviorSubject<number>(12);
    this.cells$ = new BehaviorSubject<GridCell[]>([]);
    this.char$ = new BehaviorSubject<string>('');
    this.activeCell$ = new BehaviorSubject<GridCell|undefined>(undefined);

    this.gridSize$.subscribe(size => this.cells$.next(buildCells(size)));

    this.state.menuHandler = (item) =>
      defaultHandleMenuItem(this._router, this.state, item, undefined,
        (item) => this._handlePrivateItems(item));
  }

  private _handlePrivateItems(item: MenuItem) {
    switch (item.code) {
      case MAPS_MENU_CODES.clear:
        this.clear();
        break;
      case MAPS_MENU_CODES.left:
        this.move(true);
        break;
      case MAPS_MENU_CODES.right:
        this.move(false);
        break;
      case MAPS_MENU_CODES.copy:
        this.copyMap();
        break;
    }
  }

  @HostListener('window:paste', ['$event'])
  pastEvent(event: ClipboardEvent) {
    const ser = event.clipboardData?.getData('text') || '';
    try {
      const char_map = <any>JSON.parse(ser);
      this.char$.next(char_map.text || '');
      this.gridSize$.next(char_map.size || 12);
      handleUpdate(this.cells$, (cc) => {
        cc.forEach(c => c.active = !!(char_map.map||[]).find((cmc: any) =>
          cmc.x === c.posX && cmc.y === c.posY));
        return true;
      });
    } catch (err) {
      const points = (ser||'').split(';');
      handleUpdate(this.cells$, (cc) => {
        cc.forEach(c => c.active = points.includes(`${c.posX}.${c.posY}`));
        return true;
      });
    }
  }

  updateSize(e: any) {
    this.gridSize$.next(parseInt(`${e}`, 10));
  }

  toggle(cell: GridCell) {
    handleUpdate(this.cells$, (cc) => {
      const c = cc.find(c => c.id === cell.id);
      if (c) c.active = !cell.active;
      return !!c;
    });
  }

  applyChar(e: any) {
    this.char$.next(e.target.value||'');
  }

  clear() {
    handleUpdate(this.cells$, (cc) => {
      cc.forEach(c => c.active = false);
      return true;
    });
  }

  move(left: boolean) {
    handleUpdate(this.cells$, (cc) => {
      if (left) {
        _forEach(cc, c => {
          if (c.active) {
            onLeftCell(cc, c, (lc) => lc.active = true);
            c.active = false;
          }
        });
      } else {
        _forEachRight(cc, c => {
          if (c.active) {
            onRightCell(cc, c, (rc) => rc.active = true);
            c.active = false;
          }
        });
      }
      return true;
    });
  }

  copyMap() {
    const charMap: any = {
      size: this.gridSize$.value,
      text: this.char$.value,
      map: this.cells$.value
        .filter(c => c.active)
        .map(c => ({ x: c.posX, y: c.posY }))
    };
    const ser = JSON.stringify(charMap);
    this._clipboard.copy(ser);
    this.notifier.notify('Char map copied successfully', NotificationType.success);
  }

  testOcr() {
    this.interaction.testOcr().subscribe(res => {
      if ((res.doubts||[]).length>0) {
        this._dialog.open(OcrImageMapComponent, {
          data: res,
          width: '500px',
          minHeight: '400px'
        });
      }
      console.log('TEST OCR RESULT:', res.values);
    })
  }

  over(cell: GridCell) {
    this.activeCell$.next({ ...cell });
  }
}

const onLeftCell = (cc: GridCell[], c: GridCell, handler: (cell: GridCell) => any) => {
  let leftCell: GridCell | undefined;
  if (c.x > 0) leftCell = cc.find(lc => lc.id === c.id - 1);
  if (leftCell) handler(leftCell);
}

const onRightCell = (cc: GridCell[], c: GridCell, handler: (cell: GridCell) => any) => {
  let rightCell: GridCell | undefined;
  rightCell = cc.find(rc => rc.id === c.id + 1);
  if (rightCell && rightCell.y === c.y) handler(rightCell);
}

const buildCells = (size: number): GridCell[] => {
  const cells: GridCell[] = [];
  const cs = 100 / size;
  let index = -1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      cells.push(<GridCell>{
        id: ++index,
        size: cs,
        posX: x,
        posY: y,
        x: x * cs,
        y: y * cs,
        active: false
      });
    }
  }
  return cells;
}
