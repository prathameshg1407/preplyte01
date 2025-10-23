export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;  // Make data optional
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[];  // Override to make data required for paginated responses
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}