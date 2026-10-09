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
  return typeof detail === 'string' && detail ? detail : undefined;
}
