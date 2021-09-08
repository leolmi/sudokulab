import { Algorithm, PlayAlgorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';
import { forEach as _forEach, isEqual as _isEqual } from 'lodash';
import { Dictionary } from '@ngrx/entity';
import { PlaySudokuCell } from '../PlaySudokuCell';

export const TWINS_ALGORITHM = 'Twins';

/**
 * ALGORITMO
 * Gemelli
 *
 * se all'interno di un gruppo due celle possono contenere la stessa coppia di valori
 * allora posso escludere questi valori da tutte le altre celle e, se generano allineamento,
 * escluderle anche dai gruppi intesecanti
 */
export class TwinsAlgorithm extends Algorithm implements PlayAlgorithm {
  constructor(a?: Partial<TwinsAlgorithm>) {
    super(a);
    this.name = 'Twins in group';
    this.id = TWINS_ALGORITHM;
    this.factor = 1.3;
  }
  id: string;
  name: string;
  apply = (sdk: PlaySudoku): AlgorithmResult => {

    sdk.couples

    // _forEach(sdk.groups, (g) => {
    //   const twins: Dictionary<PlaySudokuCell[]> = {};
    //   if ((g?.couples || []).length > 0) {
    //     (g?.couples || []).forEach(c => {
    //       const twin = (g?.couples || []).find(cp => cp.id !== c.id && _isEqual(cp.availables, c.availables));
    //       if (twin && !twins[twin.id] && !twins[c.id]) twins[c.id] = [c, twin];
    //     });
    //   }
    // });

    return new AlgorithmResult();
  }
}
