<?php

namespace App\Exceptions;

use Exception;
use Throwable;

/**
 * Base exception class for all custom application exceptions.
 *
 * Features:
 * - Error codes for client-side handling
 * - Additional context data
 * - HTTP status code mapping
 * - User-friendly vs developer messages
 */
abstract class BaseException extends Exception
{
    protected string $errorCode;
    protected array $context = [];
    protected int $httpStatusCode = 500;
    protected ?string $userMessage = null;

    public function __construct(
        string $message = '',
        string $errorCode = 'UNKNOWN_ERROR',
        array $context = [],
        int $httpStatusCode = 500,
        ?string $userMessage = null,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, 0, $previous);

        $this->errorCode = $errorCode;
        $this->context = $context;
        $this->httpStatusCode = $httpStatusCode;
        $this->userMessage = $userMessage;
    }

    /**
     * Get the error code for client-side handling
     */
    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    /**
     * Get additional context data
     */
    public function getContext(): array
    {
        return $this->context;
    }

    /**
     * Get HTTP status code for response
     */
    public function getHttpStatusCode(): int
    {
        return $this->httpStatusCode;
    }

    /**
     * Get user-friendly message (safe to display)
     */
    public function getUserMessage(): string
    {
        return $this->userMessage ?? $this->getDefaultUserMessage();
    }

    /**
     * Get default user-friendly message
     */
    protected function getDefaultUserMessage(): string
    {
        return 'An unexpected error occurred. Please try again later.';
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        $data = [
            'error_code' => $this->errorCode,
            'message' => $this->getUserMessage(),
        ];

        // Include context in non-production environments
        if (config('app.debug')) {
            $data['debug'] = [
                'exception' => static::class,
                'developer_message' => $this->getMessage(),
                'file' => $this->getFile(),
                'line' => $this->getLine(),
                'context' => $this->context,
            ];
        }

        return $data;
    }
}
