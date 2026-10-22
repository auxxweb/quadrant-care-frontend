const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

export function looksLikeObjectId(value?: string) {
  return Boolean(value && OBJECT_ID_RE.test(value));
}

export function displayName(value?: string) {
  const text = value?.trim() ?? '';
  if (!text || looksLikeObjectId(text)) return '';
  return text;
}

export function formatOptionLabel(name?: string, code?: string) {
  const primary = displayName(name);
  const secondary = displayName(code);
  if (!primary) return secondary;
  if (!secondary || secondary === primary) return primary;
  return `${primary} (${secondary})`;
}

export function formatRecordStatus(status?: string) {
  if (!status) return '—';
  if (status === 'ACTIVE') return 'Active';
  if (status === 'INACTIVE') return 'Inactive';
  return status
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
