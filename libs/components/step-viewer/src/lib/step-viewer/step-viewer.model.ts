import { AlgorithmResult } from '@olmi/model';

export class StepViewerItem {
  constructor(i?: Partial<StepViewerItem>) {
    Object.assign(<any>this, i || {});
    this.id = i?.id||'';
    this.cell = i?.cell||'';
    this.hasValue = !!i?.hasValue;
    this.allowHidden = !!i?.allowHidden;
    this.algorithmId = i?.algorithmId||'';
  }

  id: string;
  html?: string;
  groupTitle?: string;
  index?: number;
  result?: AlgorithmResult;
  highlights?: string;
  cell: string;
  hasValue: boolean;
  allowHidden: boolean;
  algorithmId: string;
}
