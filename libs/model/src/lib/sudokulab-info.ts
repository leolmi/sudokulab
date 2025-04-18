export class SudokulabInfo {
  constructor(i?: Partial<SudokulabInfo>) {
    Object.assign(<any>this, i || {});
  }
  session?: string;
  version?: string;
  title?: string;
  author?: string;
}
