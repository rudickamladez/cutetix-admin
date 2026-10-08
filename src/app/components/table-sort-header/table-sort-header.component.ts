import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { getSortDirection, TableSortState } from '../../shared/table-sort';

@Component({
  selector: 'app-table-sort-header',
  templateUrl: './table-sort-header.component.html',
  styleUrls: ['./table-sort-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class TableSortHeaderComponent<Column extends string = string> {
  readonly label = input.required<string>();
  readonly mobileIcon = input<IconDefinition | null>(null);
  readonly column = input.required<Column>();
  readonly sortState = input.required<TableSortState<Column>>();
  readonly sort = output<Column>();

  protected readonly icon = computed(() => {
    const direction = getSortDirection(this.sortState(), this.column());
    return direction === 'asc' ? faSortUp : direction === 'desc' ? faSortDown : faSort;
  });
}
