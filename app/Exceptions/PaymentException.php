<?php

namespace App\Exceptions;

use Throwable;

/**
 * Exception for payment-related errors.
 *
 * Use when:
 * - Payment processing fails
 * - Payment gateway errors
 * - Transaction failures
 */
class PaymentException extends BaseException
{
    protected ?string $transactionId;
    protected ?string $gatewayCode;

    public function __construct(
        string $message,
        string $errorCode = 'PAYMENT_ERROR',
        ?string $transactionId = null,
        ?string $gatewayCode = null,
        array $context = [],
        ?string $userMessage = null,
        ?Throwable $previous = null
    ) {
        $this->transactionId = $transactionId;
        $this->gatewayCode = $gatewayCode;

        parent::__construct(
            message: $message,
            errorCode: $errorCode,
            context: array_merge($context, [
                'transaction_id' => $transactionId,
                'gateway_code' => $gatewayCode,
            ]),
            httpStatusCode: 402, // Payment Required
            userMessage: $userMessage ?? 'Payment could not be processed. Please try again.',
            previous: $previous
        );
    }

    public function getTransactionId(): ?string
    {
        return $this->transactionId;
    }

    public function getGatewayCode(): ?string
    {
        return $this->gatewayCode;
    }

    /**
     * Create exception for payment declined
     */
    public static function declined(string $reason, ?string $transactionId = null): self
    {
        return new self(
            message: "Payment declined: {$reason}",
            errorCode: 'PAYMENT_DECLINED',
            transactionId: $transactionId,
            userMessage: 'Your payment was declined. Please try a different payment method.'
        );
    }

    /**
     * Create exception for payment already processed
     */
    public static function alreadyProcessed(string $orderId): self
    {
        return new self(
            message: "Payment for order {$orderId} has already been processed",
            errorCode: 'PAYMENT_ALREADY_PROCESSED',
            context: ['order_id' => $orderId],
            userMessage: 'This payment has already been processed.'
        );
    }

    /**
     * Create exception for payment gateway error
     */
    public static function gatewayError(
        string $gateway,
        string $message,
        ?string $gatewayCode = null,
        ?Throwable $previous = null
    ): self {
        return new self(
            message: "[{$gateway}] {$message}",
            errorCode: 'PAYMENT_GATEWAY_ERROR',
            gatewayCode: $gatewayCode,
            context: ['gateway' => $gateway],
            userMessage: 'Payment service is temporarily unavailable. Please try again later.',
            previous: $previous
        );
    }

    /**
     * Create exception for invalid payment amount
     */
    public static function invalidAmount(float $amount, string $reason = ''): self
    {
        return new self(
            message: "Invalid payment amount: {$amount}" . ($reason ? " - {$reason}" : ""),
            errorCode: 'INVALID_PAYMENT_AMOUNT',
            context: ['amount' => $amount, 'reason' => $reason],
            userMessage: 'The payment amount is invalid.'
        );
    }

    /**
     * Create exception for payment timeout
     */
    public static function timeout(?string $transactionId = null): self
    {
        return new self(
            message: 'Payment processing timed out',
            errorCode: 'PAYMENT_TIMEOUT',
            transactionId: $transactionId,
            userMessage: 'Payment processing timed out. Please check your payment status or try again.'
        );
    }
}
