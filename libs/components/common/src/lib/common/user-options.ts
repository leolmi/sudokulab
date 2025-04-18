import { SDK_PREFIX, SUDOKU_APP_USER_OPTIONS_KEY } from '@olmi/model';

export class AppUserOptions {

  private static getOptions = () => {
    const o = localStorage.getItem(SUDOKU_APP_USER_OPTIONS_KEY);
    try {
      return <any>JSON.parse(o||'{}')||{};
    } catch (err) {
      console.error(...SDK_PREFIX, 'error while deserializing user options', err);
    }
    return <any>{};
  }

  static getFeatures<T>(key: string, def?: Partial<T>): T {
    const o = this.getOptions();
    return <T>o[key]||<T>def||<T>{};
  }

  static updateFeature(key: string, chs: any) {
    const o: any = this.getOptions()||{};
    o[key] = { ...o[key], ...chs };
    localStorage.setItem(SUDOKU_APP_USER_OPTIONS_KEY, JSON.stringify(o));
  }

  static reset() {
    localStorage.removeItem(SUDOKU_APP_USER_OPTIONS_KEY);
    location.reload();
  }
}
