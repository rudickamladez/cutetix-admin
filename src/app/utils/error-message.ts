import { HttpErrorResponse } from '@angular/common/http';

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const detail = errorDetail(error.error);
    return detail ?? (error.message || 'An unexpected error occurred.');
  }
  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred.';
  }
  if (typeof error === 'string') {
    return error || 'An unexpected error occurred.';
  }
  const detail = errorDetail(error);
  return detail ?? 'An unexpected error occurred.';
}

function errorDetail(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null || !('detail' in payload)) {
    return undefined;
  }
  const detail = payload.detail;
  if (typeof detail === 'string' && detail) {
    return detail;
  }
  if (!Array.isArray(detail)) {
    return undefined;
  }

  const messages = detail
    .map(validationErrorMessage)
    .filter((message): message is string => message !== undefined);
  return messages.length > 0 ? messages.join('; ') : undefined;
}

function validationErrorMessage(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('msg' in value)
      || typeof value.msg !== 'string' || !value.msg) {
    return undefined;
  }

  const location = 'loc' in value && Array.isArray(value.loc)
    ? value.loc.filter((part): part is string | number => typeof part === 'string' || typeof part === 'number')
    : [];
  while (typeof location[0] === 'string' && ['body', 'query', 'path'].includes(location[0])) {
    location.shift();
  }

  const field = location.reduce<string>((path, part) => {
    if (typeof part === 'number') {
      return `${path}[${part}]`;
    }
    return path ? `${path}.${part}` : part;
  }, '');
  return field ? `${field}: ${value.msg}` : value.msg;
}
