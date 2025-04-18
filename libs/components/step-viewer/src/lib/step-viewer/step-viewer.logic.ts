import { AlgorithmResult, decodeCellId, encodeHighlights, getCoord, Highlights } from '@olmi/model';
import { StepViewerItem } from './step-viewer.model';
import { keys as _keys, reduce as _reduce } from 'lodash';
import { getAlgorithm } from '@olmi/algorithms';

export const getItems = (seq: AlgorithmResult[]): StepViewerItem[] => {
  let group: string = '';
  return _reduce(seq, (items, result, index) => {
    const alg = getAlgorithm(result.algorithm);
    if (group !== alg?.name) {
      items.push(new StepViewerItem({
        id: `title_${index}`,
        groupTitle: alg?.name,
      }));
    }
    group = alg?.name||'';
    items.push(new StepViewerItem({
      id: `item_${index}`,
      index,
      html: result.descLines.map(dl => dl.description).join('\n'),
      highlights: encodeHighlights(result.highlights),
      result,
      hasValue: !!result.value,
      allowHidden: result.allowHidden,
      cell: (result.cells.length===1) ? result.cells[0] : getFirstHLCell(result.highlights)
    }));
    return items;
  }, <StepViewerItem[]>[]);
}


const getFirstHLCell = (hl?: Partial<Highlights>): string => {
  const cell = hl?.cell||{};
  const ids = _keys(cell);
  return (ids.length===1) ? getCoord(ids[0])||'' : '';
}
