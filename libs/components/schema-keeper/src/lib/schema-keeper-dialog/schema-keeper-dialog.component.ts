import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexModule } from '@angular/flex-layout';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { BoardComponent, BoardManager, BoardStatus } from '@olmi/board';
import {
  DEFAULT_TOTAL_RANK,
  getCellsSchema,
  getFirstJsonFile,
  getSudokuByFile,
  isJsonType, isSchemaString,
  stopEvent,
  ValueOptions
} from '@olmi/model';
import { SchemaToolbarComponent } from '@olmi/schema-toolbar';

enum KeeperMode {
  chooser = 'chooser',
  text = 'text',
  file = 'file',
  schema = 'schema',
  image = 'image'
}

interface ChooserButton {
  mode: KeeperMode;
  icon: string;
  title: string;
  disabled?: boolean;
}

@Component({
  selector: 'schema-keeper',
  imports: [
    CommonModule,
    FlexModule,
    MatDialogModule,
    MatButtonModule,
    MatIcon,
    MatFormField,
    MatInput,
    MatLabel,
    BoardComponent,
    SchemaToolbarComponent
  ],
  templateUrl: './schema-keeper-dialog.component.html',
  styleUrl: './schema-keeper-dialog.component.scss',
  standalone: true
})
export class SchemaKeeperDialogComponent {
  private readonly _dialogRef = inject(MatDialogRef<SchemaKeeperDialogComponent>);
  @ViewChild('textInput') textInput: ElementRef|undefined;
  @ViewChild('fileResource') fileResource: ElementRef|undefined;
  keeperMode$: BehaviorSubject<KeeperMode>;
  text$: BehaviorSubject<string>;
  dragging$: BehaviorSubject<boolean>;

  manager: BoardManager | undefined;
  toolbarTemplate = 'nums,clear,delete';

  chooserButtons: ChooserButton[] = [
    { mode: KeeperMode.schema, icon: 'grid_on', title: 'Schema' },
    { mode: KeeperMode.text, icon: 'money', title: 'String of numbers' },
    { mode: KeeperMode.file, icon: 'description', title: 'Import json file' },
    { mode: KeeperMode.image, icon: 'image', title: 'Image', disabled: true },
  ];
  textLength$: Observable<number>;
  valid$: Observable<boolean>;

  constructor() {
    this.keeperMode$ = new BehaviorSubject<KeeperMode>(KeeperMode.chooser);
    this.dragging$ = new BehaviorSubject<boolean>(false);
    this.text$ = new BehaviorSubject<string>('');

    this.textLength$ = this.text$.pipe(map(t => `${t||''}`.length));
    this.valid$ = combineLatest([this.keeperMode$, this.text$]).pipe(map(
      ([mode, text]: [KeeperMode, string]) => isSchemaString(text)));
  }

  private _onChangeMode() {
    switch (this.keeperMode$.value) {
      case KeeperMode.chooser:
        this.text$.next('');
        break;
      case KeeperMode.text:
        setTimeout(() => this.textInput?.nativeElement.focus(), 250);
        break;
    }
  }

  private _importFromFiles(files: any) {
    const file = getFirstJsonFile(files);
    if (!file) return;
    getSudokuByFile(file, (sdk) => this._dialogRef.close(sdk.values));
  }

  private _initBoard() {
    if (this.manager) {
      const o = <ValueOptions>{
        editMode: 'schema',
        isDynamic: false,
        nextMode: 'next-in-row'
      };
      this.manager.options(<Partial<BoardStatus>>o);
      this.manager.cells$.subscribe(cells =>
        this.text$.next(getCellsSchema(cells, o)));
    }
  }

  allowDrop(e: any) {
    this.dragging$.next(true);
    e.preventDefault();
    const enabled = (<HTMLElement>e.target)?.classList.contains('drop-enabled');
    const file = getFirstJsonFile(e.dataTransfer?.items);
    e.dataTransfer.dropEffect = (!!file && enabled) ? 'copy' : 'none';
  }

  dragExit() {
    this.dragging$.next(false)
  }

  onFileChange(e: any) {
    stopEvent(e);
    this._importFromFiles((e.dataTransfer || e.target).files);
    (<HTMLInputElement>this.fileResource?.nativeElement).value = '';
  }

  drop(e: any) {
    stopEvent(e);
    this.dragExit();
    this._importFromFiles(e.dataTransfer?.files);
  }

  boardReady(manager: BoardManager) {
    if (!this.manager) {
      this.manager = manager;
      this._initBoard();
    }
  }

  setMode(mode?: KeeperMode) {
    if (mode === KeeperMode.file) {
      this.import();
    } else {
      this.keeperMode$.next(mode || KeeperMode.chooser);
      this._onChangeMode();
    }
  }

  load() {
    const schema = `${this.text$.value}`.trim().toLowerCase();
    this._dialogRef.close(schema);
  }

  import() {
    if (!!this.fileResource) this.fileResource.nativeElement.click();
  }

  keepText(e: any) {
    this.text$.next(e.target.value||'');
  }

  protected readonly DEFAULT_TOTAL_RANK = DEFAULT_TOTAL_RANK;
  protected readonly KeeperMode = KeeperMode;
}

