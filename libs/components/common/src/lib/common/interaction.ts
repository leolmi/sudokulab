import { inject, InjectionToken } from '@angular/core';
import {
  combine,
  Environment,
  LocalContext,
  OcrScanArgs,
  OcrScanResult,
  SDK_PREFIX,
  Sudoku,
  SudokuEx,
} from '@olmi/model';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const API = {
  info: 'info',
  getCatalog: 'sudoku/list',
  checkSchema: 'sudoku/check',
  updateCatalog: 'sudoku/upload',
  refreshCatalog: 'sudoku/refresh',
  ocrScan: 'ocr/scan',
  ocrMap: 'ocr/map',
  testOcr: 'ocr/test',
};

/**
 * Wrapper signal-first delle chiamate HTTP backend.
 *
 * Tutti i metodi sono `async` e ritornano `Promise<T>`: l'`HttpClient` di
 * Angular resta basato su Observable (è la API ufficiale), ma qui i
 * metodi sono one-shot per natura, quindi `firstValueFrom` permette ai
 * consumer di usare `await`/`try-catch` invece del classico
 * `subscribe({next,error})`.
 */
export class Interaction {
  readonly http = inject(HttpClient);

  constructor(public env: Environment) {}

  private _url(api: string): string {
    return combine(`${this.env.baseUrl}`, api);
  }

  ping(): Promise<any> {
    return firstValueFrom(this.http.get(this._url(API.info)));
  }

  /**
   * Restituisce il catalogo schemi.
   */
  async getCatalog(): Promise<Sudoku[]> {
    const res = await firstValueFrom(this.http.get<Sudoku[]>(this._url(API.getCatalog)));
    return (res || []).map(s => new Sudoku(s));
  }

  /**
   * Verifica/aggiorna lo schema lato server.
   */
  checkSchema(sudoku: Sudoku): Promise<SudokuEx | undefined> {
    if (LocalContext.isLevel('debug'))
      console.log(...SDK_PREFIX, 'check schema', sudoku);
    return firstValueFrom(this.http.post<SudokuEx | undefined>(this._url(API.checkSchema), sudoku));
  }

  /**
   * Aggiorna il catalogo dal file `documents/catalog.json`.
   */
  updateCatalog(path = 'documents/catalog.json'): Promise<any> {
    return firstValueFrom(this.http.post(this._url(API.updateCatalog), { path }));
  }

  /**
   * Effettua lo scan OCR di un'immagine.
   */
  ocrScan(data: OcrScanArgs): Promise<OcrScanResult> {
    return firstValueFrom(this.http.post<OcrScanResult>(this._url(API.ocrScan), data));
  }
}

export const SUDOKU_API = new InjectionToken<Interaction>('SUDOKU_API');
