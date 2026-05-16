import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatMenuModule, MatMenuPanel } from '@angular/material/menu';

@Component({
  selector: 'play-card',
  standalone: true,
  imports: [MatMenuModule],
  templateUrl: './play-card.component.html',
  styleUrl: './play-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayCardComponent {
  readonly title = input.required<string>();
  readonly icon = input<string>('');
  // se valorizzato, il click sulla card apre il mat-menu invece di emettere `clicked`.
  readonly menuTriggerFor = input<MatMenuPanel | null>(null);

  readonly clicked = output<void>();

  handleClick() {
    if (!this.menuTriggerFor()) this.clicked.emit();
  }
}
