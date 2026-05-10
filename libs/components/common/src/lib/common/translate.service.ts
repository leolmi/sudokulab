import { Injectable, Signal, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Dictionary, SDK_PREFIX, SUDOKU_USER_OPTIONS_FEATURE } from '@olmi/model';
import { AppUserOptions } from './user-options';

export type AppLang = 'en' | 'it';

export const DEFAULT_LANG: AppLang = 'en';
const NON_DEFAULT_LANGS: AppLang[] = ['it'];
const I18N_ASSET = (lang: AppLang) => `assets/i18n/${lang}.json`;
const PARAM_RX = /\{(\w+)\}/g;

interface I18nUserOptions {
  lang?: AppLang;
}

/**
 * Servizio di traduzione minimale signal-first (zero dipendenze esterne).
 *
 * Convenzione: le stringhe nel codice sono nella lingua di default (`en`),
 * il dizionario JSON contiene la mappa `<EN-string> → <traduzione>` per
 * ogni lingua non-default. La chiave è il testo EN stesso (eventualmente
 * con segnaposti `{name}` sostituiti da `t(...)`).
 */
@Injectable({ providedIn: 'root' })
export class TranslateService {
  private readonly _http = inject(HttpClient);

  private readonly _lang = signal<AppLang>(DEFAULT_LANG);
  private readonly _dict = signal<Dictionary<string>>({});
  private readonly _cache: Partial<Record<AppLang, Dictionary<string>>> = {};

  readonly lang: Signal<AppLang> = this._lang.asReadonly();

  /**
   * Lingua iniziale: preferenza utente salvata > navigator.language > default.
   */
  static resolveInitialLang(): AppLang {
    const opts = AppUserOptions.getFeatures<I18nUserOptions>(SUDOKU_USER_OPTIONS_FEATURE, {});
    if (opts?.lang === 'en' || opts?.lang === 'it') return opts.lang;
    const nav = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : '';
    return nav.toLowerCase().startsWith('it') ? 'it' : DEFAULT_LANG;
  }

  /**
   * Da chiamare in `provideAppInitializer`: imposta la lingua iniziale e,
   * se non è quella di default, fetcha il dizionario prima del bootstrap.
   */
  async init(): Promise<void> {
    await this.setLang(TranslateService.resolveInitialLang());
  }

  async setLang(lang: AppLang): Promise<void> {
    if (lang === DEFAULT_LANG) {
      this._dict.set({});
      this._lang.set(lang);
      AppUserOptions.updateFeature(SUDOKU_USER_OPTIONS_FEATURE, <I18nUserOptions>{ lang });
      return;
    }
    let dict = this._cache[lang];
    if (!dict) {
      try {
        dict = await firstValueFrom(this._http.get<Dictionary<string>>(I18N_ASSET(lang)));
        this._cache[lang] = dict;
      } catch (err) {
        console.error(...SDK_PREFIX, `failed to load i18n dict for "${lang}"`, err);
        dict = {};
      }
    }
    this._dict.set(dict);
    this._lang.set(lang);
    AppUserOptions.updateFeature(SUDOKU_USER_OPTIONS_FEATURE, <I18nUserOptions>{ lang });
  }

  toggle(): Promise<void> {
    const next: AppLang = this._lang() === 'en' ? 'it' : 'en';
    return this.setLang(next);
  }

  /**
   * Funzione di traduzione, esposta come arrow per essere usata direttamente
   * nei template (`{{ t('Solve') }}`) senza preoccuparsi del binding di `this`.
   * Legge `lang()` e `dict()` come signal: i template che la chiamano si
   * ri-valutano automaticamente al cambio lingua.
   */
  t = (key: string, params?: Record<string, string | number>): string => {
    if (!key) return '';
    const lang = this._lang();
    const raw = lang === DEFAULT_LANG ? key : (this._dict()[key] ?? key);
    return params ? raw.replace(PARAM_RX, (_, name) => {
      const v = params[name];
      return v === undefined || v === null ? '' : String(v);
    }) : raw;
  };

  /** Elenco lingue disponibili (utile per costruire UI di switch). */
  static readonly LANGS: readonly AppLang[] = [DEFAULT_LANG, ...NON_DEFAULT_LANGS];
}
