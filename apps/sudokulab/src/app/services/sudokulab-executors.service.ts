import {Inject, Injectable} from "@angular/core";
import {SudokulabPageExecutor} from "@sudokulab/model";

@Injectable()
export class SudokulabExecutorsService {
  constructor(@Inject(SudokulabPageExecutor) public executors: SudokulabPageExecutor[]) {
  }

  getExecutor(name: string): SudokulabPageExecutor|undefined {
    return (this.executors || []).find(exc => exc.name === name);
  }
}
