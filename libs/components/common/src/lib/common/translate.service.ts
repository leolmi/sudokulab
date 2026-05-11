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
 * Sono supportati due stili di chiave, mescolabili nello stesso codice:
 *
 *  - **self-key (default)**: la stringa nel codice è la frase nella lingua di
 *    default (`en`). Il dizionario JSON contiene la mappa `<EN-string> →
 *    <traduzione>`. Ideale per label corte (`'Cancel'`, `'Solve'`...). Per la
 *    lingua di default non serve alcuna entry: `t(key)` ritorna la chiave.
 *
 *  - **chiave simbolica**: la stringa nel codice è un identificatore
 *    (`'alg.OneCellForValue.title'`). In questo caso servono entrambi i file
 *    di risorsa: `en.json` mappa la chiave alla frase inglese, `it.json` alla
 *    traduzione italiana. Conviene per frasi lunghe o che si ripetono in più
 *    punti, per evitare collisioni di prefisso o drift quando il testo cambia.
 *
 * Convenzione: per la lingua di default il dict si cerca comunque, e si
 * cade in fallback sulla chiave stessa se non c'è entry — così il modello
 * self-key continua a funzionare senza popolare `en.json`.
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
   * Da chiamare in `provideAppInitializer`: imposta la lingua iniziale e
   * fetcha il relativo dizionario prima del bootstrap.
   */
  async init(): Promise<void> {
    await this.setLang(TranslateService.resolveInitialLang());
  }

  async setLang(lang: AppLang): Promise<void> {
    let dict = this._cache[lang];
    if (!dict) {
      try {
        dict = await firstValueFrom(this._http.get<Dictionary<string>>(I18N_ASSET(lang)));
        this._cache[lang] = dict;
      } catch (err) {
        // per la lingua di default il dict è opzionale (modello self-key),
        // quindi non logghiamo come errore se manca
        if (lang !== DEFAULT_LANG) {
          console.error(...SDK_PREFIX, `failed to load i18n dict for "${lang}"`, err);
        }
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
    // lookup sempre nel dict (anche per default lang), fallback alla chiave:
    // così il modello self-key continua a funzionare senza popolare en.json,
    // mentre le chiavi simboliche trovano sempre una traduzione.
    this._lang();
    const raw = this._dict()[key] ?? key;
    return params ? raw.replace(PARAM_RX, (_, name) => {
      const v = params[name];
      return v === undefined || v === null ? '' : String(v);
    }) : raw;
  };

  /** Elenco lingue disponibili (utile per costruire UI di switch). */
  static readonly LANGS: readonly AppLang[] = [DEFAULT_LANG, ...NON_DEFAULT_LANGS];
}
