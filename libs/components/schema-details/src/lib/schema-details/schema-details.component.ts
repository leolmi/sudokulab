import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-schema-details',
  imports: [],
  templateUrl: './schema-details.component.html',
  styleUrl: './schema-details.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaDetailsComponent {}
