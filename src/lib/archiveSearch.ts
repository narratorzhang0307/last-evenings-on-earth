export type ArchiveSearchValue = string | number | undefined | readonly string[];

export const ARCHIVE_QUERY_MAX_LENGTH = 80;

export function normalizeArchiveSearchText(value: ArchiveSearchValue) {
  const text = Array.isArray(value) ? value.join(' ') : String(value ?? '');
  return text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function archiveTextMatchesQuery(query: string, values: ArchiveSearchValue[]) {
  if (!query) return true;
  const searchableText = values.map(normalizeArchiveSearchText).join(' ');
  return query.split(' ').every((term) => searchableText.includes(term));
}
