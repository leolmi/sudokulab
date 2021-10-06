import {Dictionary} from "@ngrx/entity";
import {ONE_CELL_FOR_VALUE_ALGORITHM} from "./OneCellForValue.algorithm";
import {ALIGNMENT_ON_GROUP_ALGORITHM} from "./AlignmentOnGroup.algorithm";
import {ONE_VALUE_FOR_CELL_ALGORITHM} from "./OneValueForCell.algorithm";
import {TRY_NUMBER_ALGORITHM} from "./TryNumber.algorithm";
import {TWINS_ALGORITHM} from "./Twins.algorithm";

export const ALGORITHMS_FACTORS: Dictionary<string> = {
  [ONE_CELL_FOR_VALUE_ALGORITHM]: '+10',
  [ALIGNMENT_ON_GROUP_ALGORITHM]: '+15',
  [ONE_VALUE_FOR_CELL_ALGORITHM]: '+25',
  [TWINS_ALGORITHM]: '+28',
  [TRY_NUMBER_ALGORITHM]: 'x1.4'
}

export const DIFFICULTY_MAX = 'EXTREME';
export const DIFFICULTY_RANGES = [
  {value: 600, label: 'EASY'},
  {value: 800, label: 'MEDIUM'},
  {value: 1000, label: 'HARD'},
  {value: 1600, label: 'VERYHARD'}
]
