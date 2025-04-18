import { Pos } from './pos';
import { GroupType } from './consts';
import { groupId } from '../model.helper';

export class SudokuGroup extends Pos {
  constructor(g?: Partial<SudokuGroup>) {
    super(g);

    this.type = g?.type||GroupType.row;
    this.pos = g?.pos||0;
    this.id = g?.id||groupId(this.type, this.pos);
  }

  id: string;
  type: GroupType;
  pos: number;
}
