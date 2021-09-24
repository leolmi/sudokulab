import {Inject, Injectable} from "@angular/core";
import {SudokulabPage} from "@sudokulab/model";

@Injectable()
export class SudokulabPagesService {
  constructor(@Inject(SudokulabPage) public pages: SudokulabPage[]) {
  }
}
