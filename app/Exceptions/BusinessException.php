<?php

namespace App\Exceptions;

use Throwable;

/**
 * Exception for business logic errors.
 *
 * Use when:
 * - User tries to perform an invalid operation
 * - Business rules are violated
 * - Domain validation fails
 *
 * Examples:
 * - "Order already completed"
 * - "Insufficient balance"
 * - "Survey request already exists"
 */
class BusinessException extends BaseException
{
    public function __construct(
        string $message,
        string $errorCode = 'BUSINESS_ERROR',
        array $context = [],
        ?string $userMessage = null,
        ?Throwable $previous = null
    ) {
        parent::__construct(
            message: $message,
            errorCode: $errorCode,
            context: $context,
            httpStatusCode: 422, // Unprocessable Entity
            userMessage: $userMessage,
            previous: $previous
        );
    }

    protected function getDefaultUserMessage(): string
    {
        return 'The requested operation could not be completed.';
    }

    /**
     * Create exception for duplicate resource
     */
    public static function duplicate(string $resource, array $context = []): self
    {
        return new self(
            message: "Duplicate {$resource} detected",
            errorCode: 'DUPLICATE_RESOURCE',
            context: array_merge(['resource' => $resource], $context),
            userMessage: "A {$resource} with these details already exists."
        );
    }

    /**
     * Create exception for invalid state transition
     */
    public static function invalidState(string $resource, string $currentState, string $attemptedAction): self
    {
        return new self(
            message: "Cannot {$attemptedAction} {$resource} in {$currentState} state",
            errorCode: 'INVALID_STATE',
            context: [
                'resource' => $resource,
                'current_state' => $currentState,
                'attempted_action' => $attemptedAction,
            ],
            userMessage: "This operation is not allowed in the current state."
        );
    }

    /**
     * Create exception for resource limit exceeded
     */
    public static function limitExceeded(string $resource, int $limit): self
    {
        return new self(
            message: "{$resource} limit of {$limit} exceeded",
            errorCode: 'LIMIT_EXCEEDED',
            context: ['resource' => $resource, 'limit' => $limit],
            userMessage: "You have reached the maximum limit for {$resource}."
        );
    }

    /**
     * Create exception for insufficient funds/balance
     */
    public static function insufficientBalance(float $required, float $available): self
    {
        return new self(
            message: "Insufficient balance: required {$required}, available {$available}",
            errorCode: 'INSUFFICIENT_BALANCE',
            context: ['required' => $required, 'available' => $available],
            userMessage: "Insufficient balance to complete this transaction."
        );
    }
}
