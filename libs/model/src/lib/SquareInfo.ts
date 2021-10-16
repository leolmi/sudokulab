export class SquareInfo {
  constructor(i?: Partial<SquareInfo>) {
    Object.assign(this, i || {});
  }
  corners?: any[];
  image?: any;
}
