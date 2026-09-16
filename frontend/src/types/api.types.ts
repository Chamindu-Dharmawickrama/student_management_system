// Global API response shape
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  requestId?: string;
  // Present only on paginated list endpoints
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Helper type for paginated responses where `meta` is required
export type PaginatedResponse<T> = Required<Pick<ApiResponse<T>, 'meta'>> & Omit<ApiResponse<T>, 'meta'>;

// Normalized API error 
export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

// RTK Query error shape (from fetchBaseQuery) 
export interface SerializedApiError {
  status: number;
  data: {
    success: false;
    message: string;
    details?: unknown;
  };
}

// Helper to extract a human-readable error message 
// Returns '' when there is no error (null / undefined / false).
// Never returns a non-empty string unless a real error occurred.
export function getErrorMessage(error: unknown): string {
  if (error === null || error === undefined || error === false) return '';

  // RTK Query fetchBaseQuery error: { status, data: { message } }
  if (typeof error === 'object' && 'data' in error) {
    const e = error as SerializedApiError;
    return e.data?.message ?? 'Request failed';
  }

  // Plain Error objects
  if (error instanceof Error) return error.message;

  // String
  if (typeof error === 'string') return error;

  return 'An unexpected error occurred';
}
