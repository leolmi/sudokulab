import { StandardToolbarButtons, ToolbarButton, ToolbarStatus } from '@olmi/schema-toolbar';
import { BehaviorSubject, Observable } from 'rxjs';
import { extend as _extend, reduce as _reduce } from 'lodash';
import { SudokuCell } from '@olmi/model';
import { BoardCell, BoardManager } from '@olmi/board';

export const getButtons = (template: string): ToolbarButton[] => {
  const types = `${template}`.split(',').map(t => `${t||''}`.toLowerCase().trim()).filter(t => !!t);
  return _reduce(types, (bs, t) =>
    [...bs, ...(StandardToolbarButtons[t]||[])],
    <ToolbarButton[]>[]);
}

export const extendStatus = (cs$: BehaviorSubject<ToolbarStatus>, ps: Partial<ToolbarStatus>): void => {
  const cs = cs$.value;
  const ns = new ToolbarStatus();
  _extend(ns.hidden, cs.hidden, ps.hidden);
  _extend(ns.disabled, cs.disabled, ps.disabled);
  _extend(ns.active, cs.active, ps.active);
  cs$.next(ns);
}

export const setValueButtonStatus = (status: ToolbarStatus, code?: string, manager?: BoardManager): void => {
  const action = (code || '').substring(9);
  const cells = manager?.cells$.value || [];
  const isFocused = !!manager?.focused$.value;
  const cell = cells.find(c => c.coord === manager?.selection$.value?.coord);
  const isSchemaMode = manager?.status$.value.editMode === 'schema';
  const isDynamic = !!manager?.status$.value?.isDynamic;
  const isPencil = !!manager?.status$.value?.isPencil;
  const dynamicVisible = isDynamic && !cell?.text;
  const hasUserValues = (cell?.userValues||[]).length>0;
  const hasUserValue = (!!cell?.text || hasUserValues) && !cell?.isFixed;

  switch (action) {
    case 'empty':
      status.hidden[code || ''] = dynamicVisible;
      status.disabled[code||''] =!cell || (isSchemaMode ? !cell?.text : !hasUserValue);
      break;
    case 'dynamic':
      status.hidden[code || ''] = !dynamicVisible;
      break;
    default:
      if (action) {
        const nn = (cells || []).filter(c => c.text === action).length;
        if (isSchemaMode) {
          status.disabled[code || ''] = !cell;
        } else {
          status.disabled[code || ''] = !cell || (!isPencil && ((nn > 8) || (!!cell?.isFixed && !isSchemaMode))) || !!cell?.isFixed;
        }
        status.active[code || ''] = isPencil && (cell?.userValues||[]).includes(action);
      }
      break
  }
}

