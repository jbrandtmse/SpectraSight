export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  closedCount?: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    status: number;
  };
}
