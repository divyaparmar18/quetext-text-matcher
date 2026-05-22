// Standard envelope for every successful API response
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

// Standard envelope for every error API response
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

// GET /health response data
export interface HealthResponseData {
  status: 'ok';
}
