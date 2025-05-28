export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?:
    | string
    | {
        error: string;
        message: string;
        statusCode: number;
      };
  message?: string;
}

export interface ApiConfig {
  baseUrl: string;
  maxNetworkRetries: number;
  defaultTimeout: number;
  logger: Logger;
}

export interface Logger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
}

export class ConsoleLogger implements Logger {
  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[API Debug] ${message}`, data);
    }
  }

  info(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[API Info] ${message}`, data);
    }
  }

  warn(message: string, data?: any): void {
    console.warn(`[API Warning] ${message}`, data);
  }

  error(message: string, data?: any): void {
    console.error(`[API Error] ${message}`, data);
  }
}
