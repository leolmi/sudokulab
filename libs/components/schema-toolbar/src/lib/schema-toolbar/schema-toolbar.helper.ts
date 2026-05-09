import { WritableSignal } from '@angular/core';
import { extend as _extend, reduce as _reduce } from 'lodash';
import { BoardManager } from '@olmi/board';
import {
  StandardToolbarButtons,
  ToolbarButton,
  ToolbarStatus,
} from './schema-toolbar.model';

export const getButtons = (template: string): ToolbarButton[] => {
  const types = `${template}`.split(',').map(t => `${t||''}`.toLowerCase().trim()).filter(t => !!t);
  return _reduce(types, (bs, t) =>
    [...bs, ...(StandardToolbarButtons[t]||[])],
    <ToolbarButton[]>[]);
}

export const extendStatus = (cs: WritableSignal<ToolbarStatus>, ps: Partial<ToolbarStatus>): void => {
  // `update(fn)` legge il valore precedente *fuori* da un tracking context: se
  // questa funzione viene chiamata dall'interno di un `effect`/`computed`, NON
  // crea una dipendenza su `cs`, quindi la successiva `cs.set(...)` non
  // ritriggera l'effect chiamante (loop infinito).
  cs.update(prev => {
    const ns = new ToolbarStatus();
    _extend(ns.hidden, prev.hidden, ps.hidden);
    _extend(ns.disabled, prev.disabled, ps.disabled);
    _extend(ns.active, prev.active, ps.active);
    return ns;
  });
}

export const isValueLocked = (manager: BoardManager | undefined, value: string): boolean => {
  if (!manager) return false;
  const locked = manager.lockedValue$.value;
  return !!manager.status$.value.isLock && !!locked && locked.value === value;
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

