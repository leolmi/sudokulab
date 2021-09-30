export class StepInfo {
  constructor(i?: Partial<StepInfo>) {
    this.cell = '';
    Object.assign(this, i || {});
  }

  cell: string;
}
