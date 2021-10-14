import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CameraDialogOptions, CameraDialogResult, MessageType, SudokuFacade, SudokuMessage } from '@sudokulab/model';
import { BehaviorSubject } from 'rxjs';

const CAMERA_CONSTRAINTS: any = {
  facingMode: {
    exact: 'environment'
  },
  video: {
    width: {
      max: 720,
    },
    height: {
      max: 720,
    },
    aspectRatio: { ideal: 1 }
  }
}
@Component({
  selector: 'sudokulab-camera-dialog',
  templateUrl: './camera-dialog.component.html',
  styleUrls: ['./camera-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CameraDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('webcam') webcam?: ElementRef;
  @ViewChild('canvas') canvas?: ElementRef;

  isReady$: BehaviorSubject<boolean>;
  isRunning$: BehaviorSubject<boolean>;
  message$: BehaviorSubject<string>;
  error$: BehaviorSubject<boolean>;

  constructor(@Inject(MAT_DIALOG_DATA) public data: CameraDialogOptions,
              private _sudoku: SudokuFacade,
              private _dialogRef: MatDialogRef<CameraDialogComponent>) {
    this.isReady$ = new BehaviorSubject<boolean>(false);
    this.isRunning$ = new BehaviorSubject<boolean>(false);
    this.error$ = new BehaviorSubject<boolean>(false);
    this.message$ = new BehaviorSubject<string>('initializing...');

    this.message$.subscribe(message => _sudoku.raiseMessage(new SudokuMessage({ message })));
  }

  private _error(err?: any, message?: string) {
    this.error$.next(!!err);
    if (err) console.error(message||'Errors', err);
    if (message) this.message$.next(message);
  }

  private async _close() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      mediaStream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Error while stopping media stream video', err);
    }
  }

  private async _init() {

    const canvas = (<HTMLCanvasElement>this.canvas?.nativeElement);
    const webcam = (<HTMLVideoElement>this.webcam?.nativeElement);

    canvas.setAttribute('width', `${CAMERA_CONSTRAINTS.video.width.max}px`)
    canvas.setAttribute('height', `${CAMERA_CONSTRAINTS.video.height.max}px`)
    webcam.setAttribute('width', `${CAMERA_CONSTRAINTS.video.width.max}px`)
    webcam.setAttribute('height', `${CAMERA_CONSTRAINTS.video.height.max}px`)
    const ctx: CanvasDrawImage = <CanvasDrawImage>canvas.getContext("2d");

    try {
      CAMERA_CONSTRAINTS.facingMode = { exact: 'environment' };

      const mediaStream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      webcam.srcObject = mediaStream;
      webcam.play();
      this.isRunning$.next(true);

      const runProcessing = async () => {
        if (!this.isRunning$.getValue()) {
          mediaStream.getTracks().forEach(track => track.stop());
          return
        }
        ctx.drawImage(webcam, 0, 0, CAMERA_CONSTRAINTS.video.width.max, CAMERA_CONSTRAINTS.video.height.max);
        requestAnimationFrame(runProcessing);
      }

      runProcessing();
    } catch (err) {
      this._error(err, 'Errors while initializing camera');
    }
  }

  async ngAfterViewInit() {
    await this._init();
  }

  async acquire() {
    try {
      this.isRunning$.next(false);
      const canvas = (<HTMLCanvasElement>this.canvas?.nativeElement);
      const webcam = (<HTMLVideoElement>this.webcam?.nativeElement);
      const ctx: CanvasDrawImage = <CanvasDrawImage>canvas.getContext("2d");

      ctx.drawImage(webcam, 0, 0, CAMERA_CONSTRAINTS.video.width.max, CAMERA_CONSTRAINTS.video.height.max);
      const image = canvas.toDataURL();

      await this._close();

      this._dialogRef.close(new CameraDialogResult({ image }))

    } catch (err) {
      this._error(err, 'Errors while acquiring image');
    }
  }

  async close() {
    await this._close();
    this._dialogRef.close();
  }

  ngOnDestroy() {
    this._close();
  }
}
