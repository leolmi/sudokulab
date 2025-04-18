import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'image-shape',
  imports: [CommonModule],
  templateUrl: './image-shape.component.html',
  styleUrl: './image-shape.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageShapeComponent {
  image$: BehaviorSubject<string>;

  constructor() {
    this.image$ = new BehaviorSubject<string>('');
  }
}
