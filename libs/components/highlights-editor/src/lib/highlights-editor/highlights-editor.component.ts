import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerComponentBase } from '@olmi/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, combineLatest, distinctUntilChanged, takeUntil } from 'rxjs';
import { FlexModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'highlights-editor',
  imports: [
    CommonModule,
    FlexModule,
    MatFormFieldModule,
    CdkTextareaAutosize,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
  ],
  templateUrl: './highlights-editor.component.html',
  styleUrl: './highlights-editor.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HighlightsEditorComponent extends ManagerComponentBase {
  text$: BehaviorSubject<string>;
  active$: BehaviorSubject<boolean>;

  constructor() {
    super();
    this.text$ = new BehaviorSubject<string>('');
    this.active$ = new BehaviorSubject<boolean>(true);

    combineLatest([this.text$, this.active$])
      .pipe(takeUntil(this._destroy$))
      .subscribe(([txt, active]) => {
        if (active) this.manager?.setHighlights(txt);
      });

    this.active$
      .pipe(takeUntil(this._destroy$), distinctUntilChanged())
      .subscribe((active) => {
        // disattivando elimina gli highlights attivi
        if (!active) this.manager?.setHighlights();
      })
  }

  toggleLink() {
    this.active$.next(!this.active$.value);
  }

  clear() {
    this.text$.next('');
  }

  setText(e: any) {
    this.text$.next(e.target.value);
  }
}
