<?php

namespace App\Services\Logging;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Str;
use Throwable;

/**
 * Professional centralized logging service with context-aware structured logging.
 *
 * Usage:
 *   AppLogger::api()->info('API call successful', ['response' => $data]);
 *   AppLogger::payment()->error('Payment failed', ['order_id' => $orderId]);
 *   AppLogger::auth()->warning('Failed login attempt', ['email' => $email]);
 *   AppLogger::audit()->info('User action', ['action' => 'order_created']);
 *
 * With LogContext (persists across the request):
 *   LogContext::set('order_id', $orderId);
 *   AppLogger::payment()->info('Processing payment'); // includes order_id automatically
 */
class AppLogger
{
    protected string $channel;
    protected array $context = [];
    protected static ?string $requestId = null;

    public function __construct(string $channel = 'daily')
    {
        $this->channel = $channel;
        $this->context = $this->buildBaseContext();
    }

    /**
     * Create a new logger instance for API channel
     */
    public static function api(): self
    {
        return new self('api');
    }

    /**
     * Create a new logger instance for Auth channel
     */
    public static function auth(): self
    {
        return new self('auth');
    }

    /**
     * Create a new logger instance for Payment channel
     */
    public static function payment(): self
    {
        return new self('payment');
    }

    /**
     * Create a new logger instance for Security channel
     */
    public static function security(): self
    {
        return new self('security');
    }

    /**
     * Create a new logger instance for HTTP channel
     */
    public static function http(): self
    {
        return new self('http');
    }

    /**
     * Create a new logger instance for Business channel
     */
    public static function business(): self
    {
        return new self('business');
    }

    /**
     * Create a new logger instance for Jobs channel
     */
    public static function jobs(): self
    {
        return new self('jobs');
    }

    /**
     * Create a new logger instance for Performance channel
     */
    public static function performance(): self
    {
        return new self('performance');
    }

    /**
     * Create a new logger instance for Audit channel (critical business actions)
     */
    public static function audit(): self
    {
        return new self('audit');
    }

    /**
     * Create a new logger instance for the default channel
     */
    public static function default(): self
    {
        return new self('daily');
    }

    /**
     * Create a logger for a custom channel
     */
    public static function channel(string $channel): self
    {
        return new self($channel);
    }

    /**
     * Get or generate a unique request ID for tracing
     */
    public static function getRequestId(): string
    {
        if (self::$requestId === null) {
            self::$requestId = Str::uuid()->toString();
        }
        return self::$requestId;
    }

    /**
     * Set a custom request ID (useful for distributed tracing)
     */
    public static function setRequestId(string $requestId): void
    {
        self::$requestId = $requestId;
    }

    /**
     * Build base context that's included in every log entry
     */
    protected function buildBaseContext(): array
    {
        $context = [
            'request_id' => self::getRequestId(),
            'timestamp' => now()->toIso8601String(),
        ];

        // Add user context if authenticated
        try {
            $user = Auth::guard('otp')->user() ?? Auth::guard('api')->user() ?? Auth::user();
            if ($user) {
                $context['user'] = [
                    'id' => $user->id ?? null,
                    'customer_code' => $user->customer_code ?? null,
                    'phone' => $user->phone_number ?? null,
                ];
            }
        } catch (Throwable) {
            // Ignore auth errors during logging
        }

        // Add request context if available
        try {
            if (app()->runningInConsole() === false) {
                $context['request'] = [
                    'ip' => Request::ip(),
                    'method' => Request::method(),
                    'url' => Request::url(),
                    'user_agent' => Str::limit(Request::userAgent() ?? '', 200),
                ];
            }
        } catch (Throwable) {
            // Ignore request errors during logging
        }

        return $context;
    }

    /**
     * Add custom context to the logger
     */
    public function withContext(array $context): self
    {
        $this->context = array_merge($this->context, $context);
        return $this;
    }

    /**
     * Log an emergency message
     */
    public function emergency(string $message, array $context = []): void
    {
        $this->log('emergency', $message, $context);
    }

    /**
     * Log an alert message
     */
    public function alert(string $message, array $context = []): void
    {
        $this->log('alert', $message, $context);
    }

    /**
     * Log a critical message
     */
    public function critical(string $message, array $context = []): void
    {
        $this->log('critical', $message, $context);
    }

    /**
     * Log an error message
     */
    public function error(string $message, array $context = []): void
    {
        $this->log('error', $message, $context);
    }

    /**
     * Log a warning message
     */
    public function warning(string $message, array $context = []): void
    {
        $this->log('warning', $message, $context);
    }

    /**
     * Log a notice message
     */
    public function notice(string $message, array $context = []): void
    {
        $this->log('notice', $message, $context);
    }

    /**
     * Log an info message
     */
    public function info(string $message, array $context = []): void
    {
        $this->log('info', $message, $context);
    }

    /**
     * Log a debug message
     */
    public function debug(string $message, array $context = []): void
    {
        $this->log('debug', $message, $context);
    }

    /**
     * Log an exception with full stack trace
     */
    public function exception(Throwable $exception, string $message = '', array $context = []): void
    {
        $context['exception'] = [
            'class' => get_class($exception),
            'message' => $exception->getMessage(),
            'code' => $exception->getCode(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $this->formatStackTrace($exception),
        ];

        if ($exception->getPrevious()) {
            $context['exception']['previous'] = [
                'class' => get_class($exception->getPrevious()),
                'message' => $exception->getPrevious()->getMessage(),
            ];
        }

        $this->error($message ?: "Exception: {$exception->getMessage()}", $context);
    }

    /**
     * Log API request/response for external services
     */
    public function apiCall(
        string $service,
        string $method,
        string $endpoint,
        array $request = [],
        mixed $response = null,
        ?int $statusCode = null,
        ?float $duration = null,
        ?Throwable $exception = null
    ): void {
        $context = [
            'service' => $service,
            'method' => $method,
            'endpoint' => $this->maskSensitiveUrl($endpoint),
            'request' => $this->maskSensitiveData($request),
            'status_code' => $statusCode,
            'duration_ms' => $duration ? round($duration * 1000, 2) : null,
        ];

        if ($response !== null) {
            $context['response'] = $this->maskSensitiveData(
                is_string($response) ? Str::limit($response, 2000) : $response
            );
        }

        if ($exception) {
            $context['error'] = [
                'class' => get_class($exception),
                'message' => $exception->getMessage(),
            ];
            $this->error("API call failed: {$service}::{$method}", $context);
        } else {
            $level = $statusCode && $statusCode >= 400 ? 'warning' : 'info';
            $this->log($level, "API call: {$service}::{$method}", $context);
        }
    }

    /**
     * Log a payment event
     */
    public function paymentEvent(
        string $event,
        string $orderId,
        ?float $amount = null,
        ?string $status = null,
        array $extra = []
    ): void {
        $context = array_merge([
            'event' => $event,
            'order_id' => $orderId,
            'amount' => $amount,
            'status' => $status,
        ], $extra);

        $this->info("Payment: {$event}", $context);
    }

    /**
     * Log an authentication event
     */
    public function authEvent(
        string $event,
        ?string $identifier = null,
        bool $success = true,
        array $extra = []
    ): void {
        $context = array_merge([
            'event' => $event,
            'identifier' => $identifier ? $this->maskPhone($identifier) : null,
            'success' => $success,
        ], $extra);

        $level = $success ? 'info' : 'warning';
        $this->log($level, "Auth: {$event}", $context);
    }

    /**
     * Log a security event
     */
    public function securityEvent(
        string $event,
        string $severity = 'medium',
        array $context = []
    ): void {
        $context['event'] = $event;
        $context['severity'] = $severity;

        $level = match ($severity) {
            'critical' => 'critical',
            'high' => 'error',
            'medium' => 'warning',
            default => 'info',
        };

        $this->log($level, "Security: {$event}", $context);
    }

    /**
     * Start a performance timer and return a closure to log completion
     */
    public function startTimer(string $operation): callable
    {
        $startTime = microtime(true);

        return function (array $context = []) use ($operation, $startTime) {
            $duration = microtime(true) - $startTime;
            $context['duration_ms'] = round($duration * 1000, 2);
            $context['operation'] = $operation;

            AppLogger::performance()->info("Performance: {$operation}", $context);
        };
    }

    /**
     * Log an audit event (for critical business actions)
     */
    public function auditEvent(
        string $action,
        string $entity,
        ?string $entityId = null,
        array $details = []
    ): void {
        $context = array_merge([
            'action' => $action,
            'entity' => $entity,
            'entity_id' => $entityId,
            'details' => $details,
        ]);

        $this->info("Audit: {$action} on {$entity}", $context);
    }

    /**
     * Core logging method
     */
    protected function log(string $level, string $message, array $context = []): void
    {
        // Include LogContext data in every log entry
        $logContext = LogContext::all();

        $mergedContext = array_merge($this->context, $logContext, $context);

        Log::channel($this->channel)->{$level}($message, $mergedContext);
    }

    /**
     * Format exception stack trace for logging
     */
    protected function formatStackTrace(Throwable $exception): array
    {
        $trace = [];
        foreach (array_slice($exception->getTrace(), 0, 10) as $frame) {
            $trace[] = sprintf(
                '%s%s%s() at %s:%d',
                $frame['class'] ?? '',
                $frame['type'] ?? '',
                $frame['function'] ?? 'unknown',
                $frame['file'] ?? 'unknown',
                $frame['line'] ?? 0
            );
        }
        return $trace;
    }

    /**
     * Mask sensitive data in arrays
     */
    protected function maskSensitiveData(mixed $data): mixed
    {
        if (!is_array($data)) {
            return $data;
        }

        $sensitiveKeys = [
            'password',
            'secret',
            'token',
            'api_key',
            'apikey',
            'authorization',
            'bearer',
            'access_token',
            'refresh_token',
            'private_key',
            'credential',
            'card_number',
            'cvv',
            'pin',
            'otp',
            'verification_code',
        ];

        $masked = [];
        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string) $key);

            if (in_array($lowerKey, $sensitiveKeys, true)) {
                $masked[$key] = '***REDACTED***';
            } elseif (is_array($value)) {
                $masked[$key] = $this->maskSensitiveData($value);
            } else {
                $masked[$key] = $value;
            }
        }

        return $masked;
    }

    /**
     * Mask phone numbers (show last 4 digits)
     */
    protected function maskPhone(?string $phone): ?string
    {
        if (!$phone || strlen($phone) < 4) {
            return $phone;
        }

        return str_repeat('*', strlen($phone) - 4) . substr($phone, -4);
    }

    /**
     * Mask sensitive data in URLs
     */
    protected function maskSensitiveUrl(string $url): string
    {
        // Mask tokens and keys in query strings
        return preg_replace(
            '/(token|key|secret|password|api_key)=([^&]+)/i',
            '$1=***REDACTED***',
            $url
        );
    }
}
