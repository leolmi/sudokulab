import {OneCellForValueAlgorithm} from "./OneCellForValue.algorithm";
import {OneValueForCellAlgorithm} from "./OneValueForCell.algorithm";
import {TwinsAlgorithm} from "./Twins.algorithm";
import {AlignmentOnGroupAlgorithm} from "./AlignmentOnGroup.algorithm";
import {CouplesAlgorithm} from "./Couples.algorithm";
import {ChainsAlgorithm} from "./Chains.algorithm";
import { XWingsAlgorithm } from './XWings.algorithm';
import {TryNumberAlgorithm} from "./TryNumber.algorithm";
import {Algorithm} from "../Algorithm";
import {includes as _includes} from 'lodash';

const _algorithms: Algorithm[] = [];

export const _getAlgorithms = (): Algorithm[] => {
  if (_algorithms.length<1) {
    _algorithms.push(
      new OneCellForValueAlgorithm(),
      new OneValueForCellAlgorithm(),
      new TwinsAlgorithm(),
      new AlignmentOnGroupAlgorithm(),
      new CouplesAlgorithm(),
      new XWingsAlgorithm(),
      new ChainsAlgorithm(),
      new TryNumberAlgorithm());
  }
  return _algorithms;
}

export const getAlgorithms = (exclude: string[] = []): Algorithm[] => {
  return _getAlgorithms().filter(a => !_includes(exclude, a.id));
};

export const getAlgorithm = (code: string): Algorithm|undefined => {
  return getAlgorithms().find(a => a.id === code);
}
