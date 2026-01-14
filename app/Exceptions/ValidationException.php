<?php

namespace App\Exceptions;

use Throwable;

/**
 * Custom validation exception with enhanced error details.
 *
 * Use when:
 * - Custom validation logic fails
 * - API parameter validation errors
 * - Data format errors
 */
class ValidationException extends BaseException
{
    protected array $errors = [];

    public function __construct(
        string $message = 'Validation failed',
        array $errors = [],
        string $errorCode = 'VALIDATION_ERROR',
        ?Throwable $previous = null
    ) {
        parent::__construct(
            message: $message,
            errorCode: $errorCode,
            context: ['errors' => $errors],
            httpStatusCode: 422,
            userMessage: 'Please check your input and try again.',
            previous: $previous
        );

        $this->errors = $errors;
    }

    /**
     * Get validation errors
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'errors' => $this->errors,
        ]);
    }

    /**
     * Create from Laravel's ValidationException
     */
    public static function fromLaravel(\Illuminate\Validation\ValidationException $e): self
    {
        return new self(
            message: $e->getMessage(),
            errors: $e->errors(),
            previous: $e
        );
    }

    /**
     * Create for a single field error
     */
    public static function forField(string $field, string $message): self
    {
        return new self(
            message: "Validation failed for {$field}",
            errors: [$field => [$message]]
        );
    }

    /**
     * Create for missing required field
     */
    public static function required(string $field): self
    {
        return self::forField($field, "The {$field} field is required.");
    }

    /**
     * Create for invalid format
     */
    public static function invalidFormat(string $field, string $expectedFormat): self
    {
        return self::forField($field, "The {$field} field must be in {$expectedFormat} format.");
    }
}
