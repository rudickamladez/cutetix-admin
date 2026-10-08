export type SortDirection = 'asc' | 'desc';

export interface TableSortState<Column extends string = string> {
  column: Column | null;
  direction: SortDirection | null;
}

export function toggleSort<Column extends string>(
  state: TableSortState<Column>,
  column: Column
): TableSortState<Column> {
  if (state.column !== column) {
    return { column, direction: 'asc' };
  }

  if (state.direction === 'asc') {
    return { column, direction: 'desc' };
  }

  return { column: null, direction: null };
}

export function sortRows<T, Column extends string>(
  rows: readonly T[],
  state: TableSortState<Column>,
  getValue: (row: T, column: Column) => unknown
): T[] {
  if (!state.column || !state.direction) {
    return [...rows];
  }

  const direction = state.direction === 'asc' ? 1 : -1;
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  return rows
    .map((row, index) => ({ row, index, value: getValue(row, state.column!) }))
    .sort((a, b) => direction * compareValues(a.value, b.value, collator) || a.index - b.index)
    .map(({ row }) => row);
}

function compareValues(a: unknown, b: unknown, collator: Intl.Collator): number {
  if (a == null || b == null) {
    return a == null ? (b == null ? 0 : -1) : 1;
  }

  const aDate = dateValue(a);
  const bDate = dateValue(b);
  if (aDate !== null && bDate !== null) {
    return aDate - bDate;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }

  return collator.compare(String(a), String(b));
}

function dateValue(value: unknown): number | null {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : timestamp;
  }
  return null;
}
