export class SudokulabInfo {
  constructor(i?: Partial<SudokulabInfo>) {
    Object.assign(<any>this, i || {});
  }
  session?: string;
  version?: string;
  algorithmsVersion?: string;
  title?: string;
  author?: string;
}
