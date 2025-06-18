import { inject, InjectionToken } from '@angular/core';
import {
  combine,
  Environment,
  LocalContext,
  OcrScanArgs,
  OcrScanMap,
  OcrScanResult,
  SDK_PREFIX,
  Sudoku,
  SudokuEx
} from '@olmi/model';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';


const API: any = {
  info: 'info',
  getCatalog: 'sudoku/list',
  checkSchema: 'sudoku/check',
  updateCatalog: 'sudoku/upload',
  refreshCatalog: 'sudoku/refresh',

  ocrScan: 'ocr/scan',
  ocrMap: 'ocr/map',
  testOcr: 'ocr/test'
}

export class Interaction {
  readonly http: HttpClient;

  constructor(public env: Environment) {
    this.http = inject(HttpClient);
  }

  private _url(api: string): string {
    return combine(`${this.env.baseUrl}`, api);
  }

  ping(): Observable<any> {
    return this.http.get(this._url(API.info));
  }

  /**
   * restituisce il catalog
   */
  getCatalog(): Observable<Sudoku[]> {
    return this.http.get(this._url(API.getCatalog))
      .pipe(map(res =>
        (<Sudoku[]>res||[]).map(s =>
          new Sudoku(s))));
  }

  /**
   * aggiorna il catalogo
   * @param sudoku
   */
  checkSchema(sudoku: Sudoku): Observable<SudokuEx|undefined> {
    if (LocalContext.isLevel('debug'))
      console.log(...SDK_PREFIX, 'check schema', sudoku);
    return this.http.post<SudokuEx|undefined>(this._url(API.checkSchema), sudoku);
  }

  /**
   * aggiorna il catalogo dal file documents/catalog.json
   * @param path
   */
  updateCatalog(path = 'documents/catalog.json'): Observable<any> {
    return this.http.post(this._url(API.updateCatalog), { path });
  }

  /**
   * effettua il test per l'ocr
   */
  testOcr(): Observable<OcrScanResult> {
    return this.http.post<OcrScanResult>(this._url(API.testOcr), {});
  }

  /**
   * aggiorna l'associazione mappa-carattere per lo scanner
   * @param map
   */
  ocrMap(map: OcrScanMap): Observable<any> {
    return this.http.post(this._url(API.ocrMap), map);
  }

  /**
   * effettua lo scan dell'immagine
   * @param data
   */
  ocrScan(data: OcrScanArgs): Observable<OcrScanResult> {
    return this.http.post<OcrScanResult>(this._url(API.ocrScan), data);
  }
}

export const SUDOKU_API = new InjectionToken<Interaction>('SUDOKU_API');
