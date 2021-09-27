export class SudokulabInfo {
  constructor(i?: Partial<SudokulabInfo>) {
    Object.assign(this, i || {});
  }
  version: string = '0.0.0';
}
