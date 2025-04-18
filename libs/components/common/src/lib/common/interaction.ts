import { inject, InjectionToken } from '@angular/core';
import { combine, Environment, Sudoku, SudokuEx } from '@olmi/model';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

const API: any = {
  info: 'info',
  getCatalog: 'sudoku/list',
  checkSchema: 'sudoku/check',
  updateCatalog: 'sudoku/upload',
  ocrImage: 'sudoku/ocr',
  refreshCatalog: 'sudoku/refresh'
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
    return this.http.post<SudokuEx|undefined>(this._url(API.checkSchema), sudoku);
  }

  /**
   * aggiorna il catalogo dal file documents/catalog.json
   * @param path
   */
  updateCatalog(path = 'documents/catalog.json'): Observable<any> {
    return this.http.post(this._url(API.updateCatalog), { path });
  }
}

export const SUDOKU_API = new InjectionToken<Interaction>('SUDOKU_API');
