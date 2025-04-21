import { Dictionary } from './types';

export class UserValues {
  constructor(v?: Partial<UserValues>) {
    this.uv = v?.uv||'';
    this.cv = v?.cv||{};
  }
  uv: string;
  cv: Dictionary<string[]>;
}
