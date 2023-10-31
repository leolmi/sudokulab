import {Inject, Injectable} from "@angular/core";
import {GENERATOR_DATA, GeneratorData} from "@sudokulab/model";

@Injectable({
  providedIn: "root"
})
export class GeneratorWorkersManager {
  constructor(@Inject(GENERATOR_DATA) private _generator: GeneratorData) {

  }
}
