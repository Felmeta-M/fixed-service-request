<?php

namespace App\Exceptions;

use Throwable;

/**
 * Exception for resource not found errors.
 *
 * Use when:
 * - Requested resource doesn't exist
 * - Model not found
 * - API endpoint doesn't exist
 */
class NotFoundException extends BaseException
{
    protected string $resource;
    protected mixed $identifier;

    public function __construct(
        string $resource,
        mixed $identifier = null,
        ?string $userMessage = null,
        ?Throwable $previous = null
    ) {
        $this->resource = $resource;
        $this->identifier = $identifier;

        $message = $identifier
            ? "{$resource} with identifier '{$identifier}' not found"
            : "{$resource} not found";

        parent::__construct(
            message: $message,
            errorCode: 'NOT_FOUND',
            context: [
                'resource' => $resource,
                'identifier' => $identifier,
            ],
            httpStatusCode: 404,
            userMessage: $userMessage ?? "The requested {$resource} could not be found.",
            previous: $previous
        );
    }

    public function getResource(): string
    {
        return $this->resource;
    }

    public function getIdentifier(): mixed
    {
        return $this->identifier;
    }

    /**
     * Create for survey order not found
     */
    public static function surveyOrder(string $orderId): self
    {
        return new self('survey order', $orderId);
    }

    /**
     * Create for customer not found
     */
    public static function customer(string $identifier): self
    {
        return new self('customer', $identifier);
    }

    /**
     * Create for trouble ticket not found
     */
    public static function troubleTicket(string $ticketId): self
    {
        return new self('trouble ticket', $ticketId);
    }

    /**
     * Create for payment not found
     */
    public static function payment(string $paymentId): self
    {
        return new self('payment', $paymentId);
    }
}
