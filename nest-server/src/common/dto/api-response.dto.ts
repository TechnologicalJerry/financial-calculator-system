import { ApiProperty } from '@nestjs/swagger';

export class ApiResponse<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty()
  timestamp: string;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static ok<T>(data: T, message = 'Operation completed successfully'): ApiResponse<T> {
    return new ApiResponse<T>(true, message, data);
  }

  static fail<T>(message: string): ApiResponse<T> {
    return new ApiResponse<T>(false, message);
  }
}

export class PagedResponse<T> {
  @ApiProperty()
  content: T[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  size: number;

  @ApiProperty()
  totalElements: number;

  @ApiProperty()
  totalPages: number;

  constructor(content: T[], page: number, size: number, totalElements: number) {
    this.content = content;
    this.page = page;
    this.size = size;
    this.totalElements = totalElements;
    this.totalPages = Math.ceil(totalElements / (size || 1));
  }
}

export class ErrorResponse {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  errorCode: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  path: string;

  @ApiProperty()
  timestamp: string;

  constructor(errorCode: string, message: string, path: string) {
    this.success = false;
    this.errorCode = errorCode;
    this.message = message;
    this.path = path;
    this.timestamp = new Date().toISOString();
  }
}
