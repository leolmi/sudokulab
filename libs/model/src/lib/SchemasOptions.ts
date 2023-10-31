export class SchemasOptions {
  constructor(o?: Partial<SchemasOptions>) {
    this.sortBy = 'info.difficultyValue';
    this.asc = true;
    this.try = false;
    Object.assign(this, o || {});
  }
  sortBy: string;
  asc: boolean;
  try: boolean;
}
