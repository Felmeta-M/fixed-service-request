<?php

namespace App\Enums;

/**
 * Standardized error codes for API responses.
 *
 * Use these codes for client-side error handling.
 * Format: CATEGORY_SPECIFIC_ERROR
 */
enum ErrorCode: string
{
    // ===================
    // General Errors
    // ===================
    case UNKNOWN_ERROR = 'UNKNOWN_ERROR';
    case INTERNAL_ERROR = 'INTERNAL_ERROR';
    case MAINTENANCE_MODE = 'MAINTENANCE_MODE';

        // ===================
        // Validation Errors
        // ===================
    case VALIDATION_ERROR = 'VALIDATION_ERROR';
    case INVALID_FORMAT = 'INVALID_FORMAT';
    case REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING';
    case INVALID_PHONE_NUMBER = 'INVALID_PHONE_NUMBER';

        // ===================
        // Authentication Errors
        // ===================
    case AUTH_ERROR = 'AUTH_ERROR';
    case INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
    case TOKEN_EXPIRED = 'TOKEN_EXPIRED';
    case INVALID_TOKEN = 'INVALID_TOKEN';
    case INVALID_OTP = 'INVALID_OTP';
    case OTP_RATE_LIMITED = 'OTP_RATE_LIMITED';
    case SESSION_EXPIRED = 'SESSION_EXPIRED';

        // ===================
        // Authorization Errors
        // ===================
    case FORBIDDEN = 'FORBIDDEN';
    case NOT_OWNER = 'NOT_OWNER';
    case MISSING_PERMISSION = 'MISSING_PERMISSION';
    case ACCOUNT_RESTRICTED = 'ACCOUNT_RESTRICTED';

        // ===================
        // Resource Errors
        // ===================
    case NOT_FOUND = 'NOT_FOUND';
    case RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND';
    case DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE';

        // ===================
        // Business Logic Errors
        // ===================
    case BUSINESS_ERROR = 'BUSINESS_ERROR';
    case INVALID_STATE = 'INVALID_STATE';
    case LIMIT_EXCEEDED = 'LIMIT_EXCEEDED';
    case INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE';
    case OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED';

        // ===================
        // Payment Errors
        // ===================
    case PAYMENT_ERROR = 'PAYMENT_ERROR';
    case PAYMENT_DECLINED = 'PAYMENT_DECLINED';
    case PAYMENT_ALREADY_PROCESSED = 'PAYMENT_ALREADY_PROCESSED';
    case PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR';
    case INVALID_PAYMENT_AMOUNT = 'INVALID_PAYMENT_AMOUNT';
    case PAYMENT_TIMEOUT = 'PAYMENT_TIMEOUT';

        // ===================
        // External Service Errors
        // ===================
    case EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR';
    case SERVICE_TIMEOUT = 'SERVICE_TIMEOUT';
    case SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE';
    case INVALID_SERVICE_RESPONSE = 'INVALID_SERVICE_RESPONSE';
    case SERVICE_ERROR_RESPONSE = 'SERVICE_ERROR_RESPONSE';
    case SERVICE_RATE_LIMITED = 'SERVICE_RATE_LIMITED';

        // ===================
        // Rate Limiting
        // ===================
    case RATE_LIMITED = 'RATE_LIMITED';
    case TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS';

    /**
     * Get HTTP status code for this error
     */
    public function httpStatus(): int
    {
        return match ($this) {
            // 400 Bad Request
            self::VALIDATION_ERROR,
            self::INVALID_FORMAT,
            self::REQUIRED_FIELD_MISSING,
            self::INVALID_PHONE_NUMBER => 400,

            // 401 Unauthorized
            self::AUTH_ERROR,
            self::INVALID_CREDENTIALS,
            self::TOKEN_EXPIRED,
            self::INVALID_TOKEN,
            self::INVALID_OTP,
            self::SESSION_EXPIRED => 401,

            // 402 Payment Required
            self::PAYMENT_ERROR,
            self::PAYMENT_DECLINED,
            self::INVALID_PAYMENT_AMOUNT,
            self::INSUFFICIENT_BALANCE => 402,

            // 403 Forbidden
            self::FORBIDDEN,
            self::NOT_OWNER,
            self::MISSING_PERMISSION,
            self::ACCOUNT_RESTRICTED => 403,

            // 404 Not Found
            self::NOT_FOUND,
            self::RESOURCE_NOT_FOUND => 404,

            // 409 Conflict
            self::DUPLICATE_RESOURCE,
            self::PAYMENT_ALREADY_PROCESSED => 409,

            // 422 Unprocessable Entity
            self::BUSINESS_ERROR,
            self::INVALID_STATE,
            self::OPERATION_NOT_ALLOWED => 422,

            // 429 Too Many Requests
            self::RATE_LIMITED,
            self::TOO_MANY_REQUESTS,
            self::OTP_RATE_LIMITED,
            self::SERVICE_RATE_LIMITED => 429,

            // 502 Bad Gateway
            self::EXTERNAL_SERVICE_ERROR,
            self::SERVICE_ERROR_RESPONSE,
            self::INVALID_SERVICE_RESPONSE,
            self::PAYMENT_GATEWAY_ERROR => 502,

            // 503 Service Unavailable
            self::SERVICE_UNAVAILABLE,
            self::MAINTENANCE_MODE => 503,

            // 504 Gateway Timeout
            self::SERVICE_TIMEOUT,
            self::PAYMENT_TIMEOUT => 504,

            // 500 Internal Server Error (default)
            default => 500,
        };
    }

    /**
     * Get default user message for this error
     */
    public function userMessage(): string
    {
        return match ($this) {
            self::VALIDATION_ERROR => 'Please check your input and try again.',
            self::AUTH_ERROR, self::INVALID_CREDENTIALS => 'Authentication failed.',
            self::TOKEN_EXPIRED, self::SESSION_EXPIRED => 'Your session has expired. Please log in again.',
            self::INVALID_OTP => 'The OTP you entered is invalid or has expired.',
            self::FORBIDDEN => 'You do not have permission to perform this action.',
            self::NOT_FOUND => 'The requested resource could not be found.',
            self::DUPLICATE_RESOURCE => 'This resource already exists.',
            self::RATE_LIMITED, self::TOO_MANY_REQUESTS => 'Too many requests. Please try again later.',
            self::SERVICE_UNAVAILABLE => 'Service is temporarily unavailable.',
            self::PAYMENT_DECLINED => 'Payment was declined. Please try a different method.',
            self::INSUFFICIENT_BALANCE => 'Insufficient balance for this transaction.',
            default => 'An error occurred. Please try again later.',
        };
    }

    /**
     * Check if error is client recoverable
     */
    public function isRecoverable(): bool
    {
        return match ($this) {
            self::VALIDATION_ERROR,
            self::INVALID_FORMAT,
            self::INVALID_CREDENTIALS,
            self::INVALID_OTP,
            self::RATE_LIMITED,
            self::SESSION_EXPIRED => true,
            default => false,
        };
    }
}
