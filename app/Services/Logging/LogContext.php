<?php

namespace App\Services\Logging;

use Illuminate\Support\Facades\Context;

/**
 * Request-scoped logging context service.
 *
 * Provides a centralized way to add context that will be included
 * in all log entries for the current request.
 *
 * Usage:
 *   // Add context that persists for the entire request
 *   LogContext::set('order_id', $order->id);
 *   LogContext::set('customer_id', $customer->id);
 *
 *   // Add multiple values at once
 *   LogContext::merge([
 *       'survey_type' => $surveyType,
 *       'amount' => $amount,
 *   ]);
 *
 *   // Later logs will automatically include this context
 *   AppLogger::payment()->info('Payment processed'); // includes order_id, customer_id
 */
class LogContext
{
    protected const CONTEXT_KEY = 'logging_context';

    /**
     * Set a single context value
     */
    public static function set(string $key, mixed $value): void
    {
        $context = self::all();
        $context[$key] = $value;
        Context::add(self::CONTEXT_KEY, $context);
    }

    /**
     * Merge multiple context values
     */
    public static function merge(array $values): void
    {
        $context = array_merge(self::all(), $values);
        Context::add(self::CONTEXT_KEY, $context);
    }

    /**
     * Get a specific context value
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        return self::all()[$key] ?? $default;
    }

    /**
     * Get all context values
     */
    public static function all(): array
    {
        return Context::get(self::CONTEXT_KEY, []);
    }

    /**
     * Remove a context value
     */
    public static function forget(string $key): void
    {
        $context = self::all();
        unset($context[$key]);
        Context::add(self::CONTEXT_KEY, $context);
    }

    /**
     * Clear all context
     */
    public static function clear(): void
    {
        Context::forget(self::CONTEXT_KEY);
    }

    /**
     * Check if a context key exists
     */
    public static function has(string $key): bool
    {
        return array_key_exists($key, self::all());
    }

    /**
     * Set context and return a callback to restore previous state
     * Useful for temporary context in specific code blocks
     */
    public static function scope(array $values): callable
    {
        $previous = self::all();
        self::merge($values);

        return function () use ($previous) {
            Context::add(self::CONTEXT_KEY, $previous);
        };
    }

    /**
     * Run a callback with temporary context
     */
    public static function within(array $values, callable $callback): mixed
    {
        $restore = self::scope($values);

        try {
            return $callback();
        } finally {
            $restore();
        }
    }
}
