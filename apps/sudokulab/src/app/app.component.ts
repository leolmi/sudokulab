import {Component, HostListener, Inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {
  BOARD_DATA,
  BoardData,
  GENERATOR_DATA,
  GeneratorData,
  SudokuLab,
  SudokulabPage,
  SudokulabWindowService
} from '@sudokulab/model';
import {combineLatest, Observable} from 'rxjs';
import {debounceTime, filter, map} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {Dictionary} from '@ngrx/entity';

@Component({
  selector: 'sudokulab-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  status$: Observable<Dictionary<boolean>>;
  class$: Observable<any>;
  page$: Observable<SudokulabPage>;

  constructor(private _http: HttpClient,
              private _router: Router,
              private _snack: MatSnackBar,
              private _window: SudokulabWindowService,
              public sudokuLab: SudokuLab,
              @Inject(BOARD_DATA) private _board: BoardData,
              @Inject(GENERATOR_DATA) private _generator: GeneratorData) {
    this.class$ = sudokuLab.state.compactLevel$.pipe(map(cl => ({ [`compact-${cl||0}`]: true })));
    this.status$ = combineLatest([sudokuLab.state.page$, sudokuLab.state.pagesStatus$]).pipe(
      map(([page, status]) => (status||{})[page?.code||'']||{}));

    this.page$ = sudokuLab.state.page$.asObservable().pipe(
      debounceTime(100),
      filter(p => !!p),
      map(p => <SudokulabPage>p));
    sudokuLab.bootstrap();
  }

  @HostListener('window:resize', ['$event'])
  onResize(e: any) {
    this.sudokuLab.checkCompactStatus();
  }

  openPage(page: SudokulabPage) {
    setTimeout(() => this.sudokuLab.state.page$.next(page));
  }

  execute(code: string) {
    this.sudokuLab.executePageCode(code);
  }

  clickOnLogo() {
    this.sudokuLab.authorInfo();
  }
}
