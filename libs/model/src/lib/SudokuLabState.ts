import {SudokulabInfo} from "./SudokulabInfo";
import {SDK_PREFIX, SUDOKULAB_DEFAULT_THEME, SUDOKULAB_DEFAULT_VALUES_MODE} from "./consts";
import {BehaviorSubject, combineLatest, Observable} from "rxjs";
import {Sudoku} from "./Sudoku";
import {getUserSetting, saveUserSetting} from "../global.helper";
import {SchemasOptions} from "./SchemasOptions";
import {SolveStepResult} from "./logic";
import {SudokulabPage} from "./SudokulabPage";
import {Dictionary} from "@ngrx/entity";
import {PlaySudoku} from "./PlaySudoku";
import {distinctUntilChanged, filter, map, withLatestFrom} from "rxjs/operators";
import {isEqual as _isEqual} from 'lodash';
import {PrintPage} from "./PrintPage";
import {WorkingInfo} from "./WorkingInfo";
import {clearSchema} from "../sudoku.helper";


/**
 * Stato dell'applicazione
 */
export class SudokuLabState {
  constructor(env?: any) {
    this.env$ = new BehaviorSubject<any>(env||{});
    this.token$ = new BehaviorSubject<string>('');
    this.operationStatus$ = new BehaviorSubject<number>(-1);
    this.theme$ = new BehaviorSubject<string>(getUserSetting('sudoku.theme')||SUDOKULAB_DEFAULT_THEME);
    this.waiting$ = new BehaviorSubject<boolean>(false);
    this.info$ = new BehaviorSubject<SudokulabInfo>(new SudokulabInfo());
    this.schemas$ = new BehaviorSubject<Sudoku[]>([]);
    this.compactLevel$ = new BehaviorSubject<number>(0);
    this.userSettings$ = new BehaviorSubject<any>(getUserSetting('lab.activeSudoku')||{});
    this.page$ = new BehaviorSubject<SudokulabPage|null>(null);
    this.pagesStatus$ = new BehaviorSubject<Dictionary<Dictionary<boolean>>>({});
    this.valuesMode$ = new BehaviorSubject<string>(getUserSetting('sudoku.valuesMode')||SUDOKULAB_DEFAULT_VALUES_MODE)

    this.activeSudokuId$ = new BehaviorSubject<number>(parseInt(getUserSetting<string>('lab.activeSudokuId')||'0')||0);
    this.selectedSudokuId$ = new BehaviorSubject<number>(0);
    this.schemasOptions$ = new BehaviorSubject<SchemasOptions>(new SchemasOptions(getUserSetting('lab.schemasOptions')));
    this.stepInfos$ = new BehaviorSubject<SolveStepResult[]>([]);

    this.activePlaySudoku$ = new BehaviorSubject<PlaySudoku>(new PlaySudoku());
    this.activeGeneratorSudoku$ = new BehaviorSubject<PlaySudoku>(new PlaySudoku());

    this.workingInfo$ = new BehaviorSubject<WorkingInfo>(new WorkingInfo());

    this.printPages$ = new BehaviorSubject<PrintPage[]>([]);
    this.activePrintArea$ = new BehaviorSubject<string>('');

    this.isCompact$ = this.compactLevel$.pipe(map(cl => cl>0));

    this._effects();
  }

  private _effects() {
    /**
     * aggiornamento dello schema attivo per il player
     */
    combineLatest([
      this.activeSudokuId$.pipe(filter(asi => !!asi), distinctUntilChanged()),
      this.schemas$.pipe(filter(ss => (ss||[]).length>0))
    ]).subscribe(([asi, schemas]) => {
      let sudoku = schemas.find(s => s._id === asi);
      if (!sudoku) {
        sudoku = new Sudoku();
        console.warn(...SDK_PREFIX, `schema "${asi}" not found`);
      } else {
        clearSchema(sudoku);
        saveUserSetting([{ path: `lab.activeSudokuId`, data: sudoku._id }]);
      }
      const ps = new PlaySudoku({ sudoku });
      this.activePlaySudoku$.next(ps);
    });

    /**
     * salva le opzioni per lo schema
     */
    this.schemasOptions$
      .pipe(distinctUntilChanged((o1,o2) => _isEqual(o1,o2)))
      .subscribe(o => saveUserSetting([{ path: `lab.schemasOptions`, data: o }]));
  }

  env$: BehaviorSubject<any>;
  /**
   * tema attivo
   */
  token$: BehaviorSubject<string>;
  /**
   * Stato dell'operazione
   */
  operationStatus$: BehaviorSubject<number>;
  /**
   * stato di attesa
   */
  waiting$: BehaviorSubject<boolean>;
  /**
   * tema attivo
   */
  theme$: BehaviorSubject<string>;
  /**
   * informazioni app
   */
  info$: BehaviorSubject<SudokulabInfo>;
  /**
   * Schemi disponibili
   */
  schemas$: BehaviorSubject<Sudoku[]>;
  /**
   * Livello di compattamento derivante dalle dimensioni della finestra utile.
   * Governa le proprietà responsive dell'app.
   */
  compactLevel$: BehaviorSubject<number>;
  isCompact$: Observable<boolean>;
  /**
   * settings utente (dictionary di tutte le modifiche per schema)
   */
  userSettings$: BehaviorSubject<any>;
  /**
   * pagina attiva
   */
  page$: BehaviorSubject<SudokulabPage|null>;
  /**
   * stato degli elementi per pagina
   */
  pagesStatus$: BehaviorSubject<Dictionary<Dictionary<boolean>>>;

  /**
   * modalità di rappresentazione dei valori in cella
   */
  valuesMode$: BehaviorSubject<string>;

  /**
   * schema attivo per il player
   */
  activePlaySudoku$: BehaviorSubject<PlaySudoku>;

  /**
   * schema per il generatore
   */
  activeGeneratorSudoku$: BehaviorSubject<PlaySudoku>;

  /**
   * identificativo dello schem attivo nel player
   */
  activeSudokuId$: BehaviorSubject<number>;

  /**
   * identificativo dello schem selezionato nella lista
   */
  selectedSudokuId$: BehaviorSubject<number>;
  /**
   * opzioni per la lista degli schemi
   */
  schemasOptions$: BehaviorSubject<SchemasOptions>;
  /**
   * informazioni per lo step seguente
   */
  stepInfos$: BehaviorSubject<SolveStepResult[]>;
  /**
   * pagine per la stampa
   */
  printPages$: BehaviorSubject<PrintPage[]>;
  /**
   * area di stampa attiva
   */
  activePrintArea$: BehaviorSubject<string>;

  /**
   * stato del generator
   */
  workingInfo$: BehaviorSubject<WorkingInfo>;
}
