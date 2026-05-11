import { ChangeDetectionStrategy, Component, effect, HostListener, inject, signal } from '@angular/core';
import { PageBase } from '../../model/page.base';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { forEach as _forEach, forEachRight as _forEachRight, cloneDeep as _clone } from 'lodash';
import { isSchemaString, MenuItem, NotificationType } from '@olmi/model';
import { defaultHandleMenuItem } from '../pages.helper';
import { MAPS_MENU_CODES } from './maps.menu';
import { Clipboard } from '@angular/cdk/clipboard';


class GridCell {
  id = 0;
  size = 0;
  x = 0;
  y = 0;
  posX = 0;
  posY = 0;
  active = false;
}

@Component({
  imports: [
    FormsModule,
    MatSlider,
    MatSliderThumb,
    ReactiveFormsModule,
  ],
  selector: 'sudoku-maps',
  templateUrl: './maps.component.html',
  styleUrl: './maps.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapsComponent extends PageBase {
  private readonly _clipboard = inject(Clipboard);

  readonly gridSize = signal<number>(12);
  readonly cells = signal<GridCell[]>(buildCells(12));
  readonly char = signal<string>('');
  readonly activeCell = signal<GridCell | undefined>(undefined);

  constructor() {
    super();

    // gridSize → ricostruzione griglia
    effect(() => {
      const size = this.gridSize();
      this.cells.set(buildCells(size));
    });

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
      this.char.set(char_map.text || '');
      this.gridSize.set(char_map.size || 12);
      this._mutateCells(cc => cc.forEach(c => c.active = !!(char_map.map || []).find((cmc: any) =>
        cmc.x === c.posX && cmc.y === c.posY)));
    } catch (err) {
      const points = (ser || '').split(';');
      this._mutateCells(cc => cc.forEach(c => c.active = points.includes(`${c.posX}.${c.posY}`)));
    }
  }

  updateSize(e: any) {
    this.gridSize.set(parseInt(`${e}`, 10));
  }

  toggle(cell: GridCell) {
    this._mutateCells(cc => {
      const c = cc.find(c => c.id === cell.id);
      if (c) c.active = !cell.active;
    });
  }

  applyChar(e: any) {
    this.char.set(e.target.value || '');
  }

  clear() {
    this._mutateCells(cc => cc.forEach(c => c.active = false));
  }

  move(left: boolean) {
    this._mutateCells(cc => {
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
    });
  }

  copyMap() {
    const charMap: any = {
      size: this.gridSize(),
      text: this.char(),
      map: this.cells()
        .filter(c => c.active)
        .map(c => ({ x: c.posX, y: c.posY })),
    };
    const ser = JSON.stringify(charMap);
    this._clipboard.copy(ser);
    this.notifier.notify(this.t('Char map copied successfully'), NotificationType.success);
  }

  over(cell: GridCell) {
    this.activeCell.set({ ...cell });
  }

  private _mutateCells(mutator: (cc: GridCell[]) => void) {
    this.cells.update(prev => {
      const next = _clone(prev);
      mutator(next);
      return next;
    });
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
        active: false,
      });
    }
  }
  return cells;
}
