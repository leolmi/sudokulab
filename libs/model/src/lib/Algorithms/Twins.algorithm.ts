import { Algorithm, PlayAlgorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';

export const TWINS_ALGORITHM = 'Twins';

/**
 * ALGORITMO (OBSOLETO)
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

    return new AlgorithmResult({
      algorithm: this.id
    });
  }
}
