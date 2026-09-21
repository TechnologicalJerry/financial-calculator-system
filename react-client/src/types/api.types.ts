export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  correlationId?: string | null;
  timestamp: string;
}

export interface ValidationErrorDetails {
  field: string;
  rejectedValue?: string | null;
  message: string;
}

export interface ErrorResponse {
  success: false;
  errorCode: number;
  errorName: string;
  message: string;
  path: string;
  correlationId?: string | null;
  timestamp: string;
  fieldErrors?: ValidationErrorDetails[] | null;
}
