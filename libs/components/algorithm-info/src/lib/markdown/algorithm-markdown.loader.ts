import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SDK_PREFIX } from '@olmi/model';
import { AppLang } from '@olmi/common';

/**
 * Caricatore dei markdown delle pagine di descrizione.
 *
 * I file vivono in `apps/sudoku/public/i18n/<basePath>/<key>.<lang>.md` e
 * vengono serviti come asset all'URL `assets/i18n/<basePath>/<key>.<lang>.md`
 * (vedi `apps/sudoku/project.json`).
 *
 * `basePath` è un'astrazione che permette di servire più "famiglie" di pagine:
 *   - `algorithms` per le pagine di descrizione algoritmi;
 *   - `pages` per le pagine applicative (es. `Infos`).
 *
 * Cache in-memory per `(basePath, key, lang)`: ogni file è scaricato al massimo
 * una volta nella vita della SPA. In caso di 404 (es. traduzione non ancora
 * scritta) la promise risolve con stringa vuota, così il chiamante può
 * decidere il fallback (tipicamente: ritenta in `en`).
 */
@Injectable({ providedIn: 'root' })
export class AlgorithmMarkdownLoader {
  private readonly _http = inject(HttpClient);
  private readonly _cache = new Map<string, Promise<string>>();

  load(basePath: string, key: string, lang: AppLang): Promise<string> {
    const cacheKey = `${basePath}/${key}.${lang}`;
    let p = this._cache.get(cacheKey);
    if (!p) {
      p = firstValueFrom(
        this._http
          .get(`assets/i18n/${basePath}/${key}.${lang}.md`, { responseType: 'text' })
          .pipe(
            catchError(() => {
              console.warn(...SDK_PREFIX, `markdown not found: ${cacheKey}`);
              return of('');
            })
          )
      );
      this._cache.set(cacheKey, p);
    }
    return p;
  }
}
