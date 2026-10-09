import { ChangeDetectionStrategy, Component, ElementRef, HostListener, input, model, ViewChild } from '@angular/core';

@Component({
    selector: 'app-table-search',
    templateUrl: './table-search.component.html',
    styleUrls: ['./table-search.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class TableSearchComponent {
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  readonly value = model('');
  readonly placeholder = input('Search');

  @HostListener('document:keydown', ['$event'])
  protected focusSearchOnSlash(event: KeyboardEvent): void {
    if (event.key !== '/' || event.defaultPrevented) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) {
      return;
    }

    event.preventDefault();
    this.searchInput?.nativeElement.focus();
  }
}
