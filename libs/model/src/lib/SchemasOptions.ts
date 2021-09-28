export class SchemasOptions {
  constructor(o?: Partial<SchemasOptions>) {
    this.sortBy = '';
    this.asc = false;
    this.try = true;
    Object.assign(this, o || {});
  }
  sortBy: string;
  asc: boolean;
  try: boolean;
}
