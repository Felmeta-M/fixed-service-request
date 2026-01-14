<?php

namespace App\Exceptions;

use Throwable;

/**
 * Exception for authentication failures.
 *
 * Use when:
 * - User credentials are invalid
 * - Token is expired or invalid
 * - Session has expired
 * - OTP verification fails
 */
class AuthenticationException extends BaseException
{
    public function __construct(
        string $message = 'Authentication failed',
        string $errorCode = 'AUTH_ERROR',
        array $context = [],
        ?string $userMessage = null,
        ?Throwable $previous = null
    ) {
        parent::__construct(
            message: $message,
            errorCode: $errorCode,
            context: $context,
            httpStatusCode: 401,
            userMessage: $userMessage ?? 'Authentication failed. Please log in again.',
            previous: $previous
        );
    }

    /**
     * Create exception for invalid credentials
     */
    public static function invalidCredentials(): self
    {
        return new self(
            message: 'Invalid credentials provided',
            errorCode: 'INVALID_CREDENTIALS',
            userMessage: 'The provided credentials are incorrect.'
        );
    }

    /**
     * Create exception for expired token
     */
    public static function tokenExpired(): self
    {
        return new self(
            message: 'Authentication token has expired',
            errorCode: 'TOKEN_EXPIRED',
            userMessage: 'Your session has expired. Please log in again.'
        );
    }

    /**
     * Create exception for invalid token
     */
    public static function invalidToken(): self
    {
        return new self(
            message: 'Invalid authentication token',
            errorCode: 'INVALID_TOKEN',
            userMessage: 'Invalid authentication. Please log in again.'
        );
    }

    /**
     * Create exception for invalid OTP
     */
    public static function invalidOtp(): self
    {
        return new self(
            message: 'Invalid or expired OTP',
            errorCode: 'INVALID_OTP',
            userMessage: 'The OTP you entered is invalid or has expired.'
        );
    }

    /**
     * Create exception for OTP rate limit
     */
    public static function otpRateLimited(int $retryAfterSeconds): self
    {
        return new self(
            message: "OTP rate limit exceeded, retry after {$retryAfterSeconds} seconds",
            errorCode: 'OTP_RATE_LIMITED',
            context: ['retry_after' => $retryAfterSeconds],
            userMessage: "Too many OTP requests. Please wait {$retryAfterSeconds} seconds before trying again."
        );
    }

    /**
     * Create exception for session expired
     */
    public static function sessionExpired(): self
    {
        return new self(
            message: 'Session has expired',
            errorCode: 'SESSION_EXPIRED',
            userMessage: 'Your session has expired. Please log in again.'
        );
    }
}
