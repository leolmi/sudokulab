import {
  DEFAULT_TOTAL_RANK,
  hasUserValues,
  isUnchangedOrComplete,
  SDK_PREFIX,
  SUDOKU_APP_USER_OPTIONS_KEY,
  UserValues
} from '@olmi/model';
import { PLAYER_BOARD_USER_VALUES_PREFIX_KEY } from '@olmi/board';

export class AppUserOptions {

  private static getOptions = () => {
    const o = localStorage.getItem(SUDOKU_APP_USER_OPTIONS_KEY);
    try {
      return <any>JSON.parse(o || '{}') || {};
    } catch (err) {
      console.error(...SDK_PREFIX, 'error while deserializing user options', err);
    }
    return <any>{};
  }

  static getFeatures<T>(key: string, def?: Partial<T>): T {
    const o = this.getOptions();
    return <T>o[key] || <T>def || <T>{};
  }

  static updateFeature(key: string, chs: any) {
    const o: any = this.getOptions() || {};
    o[key] = { ...o[key], ...chs };
    localStorage.setItem(SUDOKU_APP_USER_OPTIONS_KEY, JSON.stringify(o));
  }

  static reset() {
    localStorage.removeItem(SUDOKU_APP_USER_OPTIONS_KEY);
    location.reload();
  }

  static getUserValues(id?: string): UserValues|undefined {
    const uv = localStorage.getItem(`${PLAYER_BOARD_USER_VALUES_PREFIX_KEY}${id || ''}`);
    try {
      return uv ? <UserValues>JSON.parse(uv) : undefined;
    } catch (err) {
      return undefined;
    }
  }

  static setUserValues(id: string, v: UserValues): void {
    const key = `${PLAYER_BOARD_USER_VALUES_PREFIX_KEY}${id}`;
    if (v.uv.length === DEFAULT_TOTAL_RANK && (!isUnchangedOrComplete(v, id) || hasUserValues(v))) {
      const actual = localStorage.getItem(`${PLAYER_BOARD_USER_VALUES_PREFIX_KEY}${id}`) || '';
      const current = JSON.stringify(v);
      if (actual !== current) localStorage.setItem(key, current);
    } else {
      localStorage.removeItem(key);
    }
  }
}
