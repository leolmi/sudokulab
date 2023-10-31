import {BehaviorSubject, Observable, Subject} from "rxjs";
import {CameraDialogOptions} from "../CameraDialogOptions";
import {HandleImageResult} from "../HandleImageResult";
import {HandleImageOptions} from "../HandleImageOptions";
import {Sudoku} from "../Sudoku";
import {LoadSudokuOptions} from "../LoadSudokuOptions";
import {SudokuMessage} from "../SudokuMessage";
import {SudokuLabState} from "../SudokuLabState";
import {ImportOptions} from "../ImportOptions";
import {PlaySudoku} from "../PlaySudoku";
import {SudokulabPage} from "../SudokulabPage";
import {SchemasOptions} from "../SchemasOptions";
import {PlaySudokuOptions} from "../PlaySudokuOptions";
import {UploadDialogOptions} from "../UploadDialogOptions";
import {SudokuData} from "../tokens";

export abstract class SudokuLab {
  abstract state: SudokuLabState;
  abstract pages: SudokulabPage[];
  abstract internalCode$: Subject<string>;
  abstract context$: BehaviorSubject<SudokuData<any>|undefined>;


  /**
   * bootstrap applicazione
   */
  abstract bootstrap(): void;

  /**
   * gestione sudoku-lab
   * @param operation
   * @param key
   * @param args
   */
  abstract manage(operation: string, key: string, args?: any): Observable<any>;

  /**
   * mostra i messaggi
   * @param message
   */
  abstract showMessage(message: SudokuMessage): void;
  abstract raiseError(err: any, message?: string): void;

  /**
   * esegue le azioni generiche
   * @param code
   * @param data
   */
  abstract executeAction(code: string, data: any): void;

  /**
   * esegue il codice sulla pagina attiva
   * @param code
   */
  abstract executePageCode(code: string): void;

  /**
   * acquisisce schemi dalla telecamera
   * - apre popup telecamera
   * - se confermata invia l'immagine all'interprete delle immagini
   * - l'interprete invia l'immagine al gestore di schema
   * - il gestore di schema apre lo schema o valorizza l'esistente
   * @param o
   */
  abstract camera(o?: Partial<ImportOptions>): Observable<ImportOptions>;

  /**
   * acquisisce schemi
   * @param o
   */
  abstract upload(o?: Partial<UploadDialogOptions>): Observable<any>;

  /**
   * interpreta l'immagine
   * - l'interprete invia l'immagine al gestore di schema
   * - il gestore di schema apre lo schema o valorizza l'esistente
   * @param o
   */
  abstract handleImage(o?: ImportOptions): Observable<ImportOptions>;

  /**
   * permette all'utente di gestire lo schema in import verificando lo schema,
   * e modificandone i valori
   * @param o
   */
  abstract checkSchema(o?: ImportOptions): Observable<ImportOptions>;

  /**
   * carica lo schema nel contesto corrente
   * @param o
   */
  abstract loadSudoku(o?: ImportOptions): void;

  /**
   * effettua il check remoto
   * @param sdk
   */
  abstract remoteCheckSchema(sdk: PlaySudoku): Observable<any>;

  /**
   * Verifica lo stato compact
   */
  abstract checkCompactStatus(): void;

  /**
   * Informazioni dell'autore
   */
  abstract authorInfo(): void;

  /**
   * attiva lo schema selezionato
   */
  abstract activateSelectedSchema(id?: number): void;

  /**
   * aggiorna le opzioni per gli schemi
   * @param o
   */
  abstract updateSchemasOptions(o?: Partial<SchemasOptions>): void;

  /**
   * aggiorna le opzioni per il player
   * @param o
   */
  abstract updatePlayerOptions(o?: Partial<PlaySudokuOptions>): void;


  /**
   * emette un'azione da parte della pagina gestibile anche esternamente all'esecutore della pagina
   * @param internal_code
   */
  abstract emit(internal_code: string): void;
}
