/**
 * Helper utilities for API error handling
 * Provides compatibility with existing error handling patterns
 */
import { ApiClientError } from './api-client';

/**
 * Type guard to check if an error is an ApiClientError
 */
export function isApiClientError(error: unknown): error is ApiClientError {
    return error instanceof ApiClientError;
}

/**
 * Helper to extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
    if (isApiClientError(error)) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
}

/**
 * Helper to extract error data from various error types
 */
export function getErrorData(error: unknown): any {
    if (isApiClientError(error)) {
        return error.data;
    }
    return null;
}

/**
 * Helper to extract error status from various error types
 */
export function getErrorStatus(error: unknown): number | undefined {
    if (isApiClientError(error)) {
        return error.status;
    }
    return undefined;
}

