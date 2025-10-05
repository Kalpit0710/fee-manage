import { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  technical?: string;
}

export class ErrorHandler {
  static getUserFriendlyError(error: any): AppError {
    if (!error) {
      return {
        title: 'Unknown Error',
        message: 'An unexpected error occurred. Please try again.',
        type: 'error'
      };
    }

    if (this.isNetworkError(error)) {
      return this.getNetworkError();
    }

    if (this.isPostgrestError(error)) {
      return this.getPostgrestError(error);
    }

    if (this.isAuthError(error)) {
      return this.getAuthError(error);
    }

    if (error instanceof Error) {
      return {
        title: 'Error',
        message: error.message || 'An unexpected error occurred. Please try again.',
        type: 'error',
        technical: error.stack
      };
    }

    if (typeof error === 'string') {
      return {
        title: 'Error',
        message: error,
        type: 'error'
      };
    }

    return {
      title: 'Unexpected Error',
      message: 'Something went wrong. Please contact support if this continues.',
      type: 'error',
      technical: JSON.stringify(error)
    };
  }

  private static isNetworkError(error: any): boolean {
    return (
      error?.message?.includes('fetch') ||
      error?.message?.includes('network') ||
      error?.message?.includes('NetworkError') ||
      error?.code === 'NETWORK_ERROR'
    );
  }

  private static getNetworkError(): AppError {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      type: 'error'
    };
  }

  private static isPostgrestError(error: any): error is PostgrestError {
    return error?.code && error?.message && error?.details;
  }

  private static getPostgrestError(error: PostgrestError): AppError {
    const errorMap: Record<string, AppError> = {
      '23505': {
        title: 'Duplicate Entry',
        message: 'This record already exists. Please check your input and try again.',
        type: 'warning',
        technical: error.details
      },
      '23503': {
        title: 'Invalid Reference',
        message: 'The selected option is no longer available. Please refresh and try again.',
        type: 'warning',
        technical: error.details
      },
      '23502': {
        title: 'Missing Information',
        message: 'Required information is missing. Please fill in all required fields.',
        type: 'warning',
        technical: error.details
      },
      'PGRST116': {
        title: 'Not Found',
        message: 'The requested record could not be found.',
        type: 'warning',
        technical: error.message
      },
      '42501': {
        title: 'Permission Denied',
        message: 'You do not have permission to perform this action.',
        type: 'error',
        technical: error.details
      }
    };

    const mappedError = errorMap[error.code];
    if (mappedError) {
      return mappedError;
    }

    if (error.message.includes('duplicate key')) {
      return errorMap['23505'];
    }

    if (error.message.includes('foreign key')) {
      return errorMap['23503'];
    }

    if (error.message.includes('not null')) {
      return errorMap['23502'];
    }

    return {
      title: 'Database Error',
      message: 'A database error occurred. Please try again or contact support.',
      type: 'error',
      technical: `${error.code}: ${error.message}\n${error.details || ''}`
    };
  }

  private static isAuthError(error: any): boolean {
    return (
      error?.status === 401 ||
      error?.status === 403 ||
      error?.message?.includes('auth') ||
      error?.message?.includes('unauthorized')
    );
  }

  private static getAuthError(error: any): AppError {
    if (error?.message?.includes('Invalid login credentials')) {
      return {
        title: 'Login Failed',
        message: 'Invalid email or password. Please try again.',
        type: 'error'
      };
    }

    if (error?.message?.includes('Email not confirmed')) {
      return {
        title: 'Email Not Verified',
        message: 'Please verify your email address before logging in.',
        type: 'warning'
      };
    }

    if (error?.status === 403) {
      return {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        type: 'error'
      };
    }

    return {
      title: 'Authentication Error',
      message: 'Your session may have expired. Please log in again.',
      type: 'warning'
    };
  }

  static logError(error: any, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔴 Error${context ? ` in ${context}` : ''}`);
      console.error('Error:', error);
      if (error?.stack) {
        console.error('Stack:', error.stack);
      }
      console.groupEnd();
    }
  }

  static handleError(error: any, context?: string): AppError {
    this.logError(error, context);
    return this.getUserFriendlyError(error);
  }
}

export const getErrorMessage = (error: any): string => {
  const appError = ErrorHandler.getUserFriendlyError(error);
  return appError.message;
};

export const getErrorTitle = (error: any): string => {
  const appError = ErrorHandler.getUserFriendlyError(error);
  return appError.title;
};
