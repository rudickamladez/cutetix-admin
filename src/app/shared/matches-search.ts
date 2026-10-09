export function matchesSearch(search: string, fields: readonly unknown[]): boolean {
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const searchableFields = fields.map((field) => String(field ?? '').toLowerCase());

  return terms.every((term) => searchableFields.some((field) => field.includes(term)));
}
