<?php

namespace App\Exceptions;

use Throwable;

/**
 * Exception for external service failures.
 *
 * Use when:
 * - Third-party API calls fail
 * - External services are unavailable
 * - Network timeouts occur
 *
 * Examples:
 * - Telebirr payment API failure
 * - Esignet authentication timeout
 * - SOAP service unavailable
 */
class ExternalServiceException extends BaseException
{
    protected string $service;
    protected ?int $serviceStatusCode;
    protected ?string $serviceResponse;

    public function __construct(
        string $service,
        string $message,
        string $errorCode = 'EXTERNAL_SERVICE_ERROR',
        ?int $serviceStatusCode = null,
        ?string $serviceResponse = null,
        array $context = [],
        ?Throwable $previous = null
    ) {
        $this->service = $service;
        $this->serviceStatusCode = $serviceStatusCode;
        $this->serviceResponse = $serviceResponse;

        parent::__construct(
            message: "[{$service}] {$message}",
            errorCode: $errorCode,
            context: array_merge($context, [
                'service' => $service,
                'service_status_code' => $serviceStatusCode,
            ]),
            httpStatusCode: 502, // Bad Gateway
            userMessage: "The {$service} service is temporarily unavailable. Please try again later.",
            previous: $previous
        );
    }

    public function getService(): string
    {
        return $this->service;
    }

    public function getServiceStatusCode(): ?int
    {
        return $this->serviceStatusCode;
    }

    public function getServiceResponse(): ?string
    {
        return $this->serviceResponse;
    }

    /**
     * Create exception for connection timeout
     */
    public static function timeout(string $service, int $timeoutSeconds): self
    {
        return new self(
            service: $service,
            message: "Connection timeout after {$timeoutSeconds} seconds",
            errorCode: 'SERVICE_TIMEOUT',
            context: ['timeout_seconds' => $timeoutSeconds]
        );
    }

    /**
     * Create exception for service unavailable
     */
    public static function unavailable(string $service, ?Throwable $previous = null): self
    {
        return new self(
            service: $service,
            message: "Service is currently unavailable",
            errorCode: 'SERVICE_UNAVAILABLE',
            previous: $previous
        );
    }

    /**
     * Create exception for invalid response from service
     */
    public static function invalidResponse(string $service, string $details, ?string $response = null): self
    {
        return new self(
            service: $service,
            message: "Invalid response: {$details}",
            errorCode: 'INVALID_SERVICE_RESPONSE',
            serviceResponse: $response,
            context: ['details' => $details]
        );
    }

    /**
     * Create exception for service error response
     */
    public static function errorResponse(
        string $service,
        int $statusCode,
        string $message,
        ?string $response = null
    ): self {
        return new self(
            service: $service,
            message: $message,
            errorCode: 'SERVICE_ERROR_RESPONSE',
            serviceStatusCode: $statusCode,
            serviceResponse: $response
        );
    }

    /**
     * Create exception for rate limit exceeded
     */
    public static function rateLimited(string $service, ?int $retryAfter = null): self
    {
        $exception = new self(
            service: $service,
            message: "Rate limit exceeded" . ($retryAfter ? ", retry after {$retryAfter} seconds" : ""),
            errorCode: 'SERVICE_RATE_LIMITED',
            serviceStatusCode: 429,
            context: ['retry_after' => $retryAfter]
        );

        $exception->httpStatusCode = 429;

        return $exception;
    }
}
