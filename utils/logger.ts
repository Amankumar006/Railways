/**
 * Production-safe logging utility
 * Only logs in development mode, silent in production
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.ERROR;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    return `${prefix} ${message}`;
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  error(message: string, error?: any, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message), error, ...args);
    }
  }

  // Specific methods for common use cases
  apiCall(method: string, url: string, data?: any) {
    this.debug(`API ${method} ${url}`, data);
  }

  apiResponse(method: string, url: string, status: number, data?: any) {
    this.debug(`API ${method} ${url} -> ${status}`, data);
  }

  apiError(method: string, url: string, error: any) {
    this.error(`API ${method} ${url} failed`, error);
  }

  userAction(action: string, data?: any) {
    this.info(`User action: ${action}`, data);
  }

  performance(operation: string, duration: number) {
    this.debug(`Performance: ${operation} took ${duration}ms`);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience exports for common use cases
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
export const logApiCall = logger.apiCall.bind(logger);
export const logApiResponse = logger.apiResponse.bind(logger);
export const logApiError = logger.apiError.bind(logger);
export const logUserAction = logger.userAction.bind(logger);
export const logPerformance = logger.performance.bind(logger); 