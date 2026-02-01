<?php

namespace App\Services;

use App\Enums\ErrorCode;
use App\Exceptions\BaseException;
use App\Services\Logging\AppLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Professional API Response service for consistent response formatting.
 *
 * Features:
 * - Standardized success/error responses
 * - Error codes for client-side handling
 * - Request ID tracking
 * - Debug information in development
 * - Automatic logging of errors
 * - Error message sanitization to prevent sensitive data leakage
 *
 * Usage:
 *   return ApiResponse::success($data);
 *   return ApiResponse::error('Not found', ErrorCode::NOT_FOUND);
 *   return ApiResponse::fromException($exception);
 *   return ApiResponse::safeError($exception, 'Custom fallback message');
 */
class ApiResponse
{
    /**
     * Patterns that indicate sensitive error messages that should not be exposed to users.
     * These patterns match database errors, connection issues, and internal system details.
     */
    private static array $sensitivePatterns = [
        // Database errors
        '/SQLSTATE\[/',
        '/PDO/',
        '/pgbouncer/i',
        '/postgres/i',
        '/mysql/i',
        '/sqlite/i',
        '/deadlock/i',
        '/duplicate.*key/i',
        '/foreign.*key.*constraint/i',
        '/unique.*constraint/i',
        '/connection.*refused/i',
        '/connection.*timed.*out/i',
        '/too.*many.*connections/i',
        // Third-party/external service errors
        '/SOAP/i',
        '/cURL/i',
        '/HTTP.*error/i',
        '/SSL.*certificate/i',
        '/connection.*reset/i',
        '/socket/i',
        '/timeout.*expired/i',
        // Internal system errors
        '/file_get_contents/i',
        '/fopen/i',
        '/include.*failed/i',
        '/require.*failed/i',
        '/class.*not.*found/i',
        '/undefined.*method/i',
        '/undefined.*property/i',
        '/undefined.*variable/i',
        '/undefined.*index/i',
        '/stack.*trace/i',
        '/vendor\//',
        '/at.*line.*\d+/',
        // Redis/Cache errors
        '/redis/i',
        '/memcache/i',
        // Server configuration
        '/permission.*denied/i',
        '/no.*such.*file/i',
        '/disk.*quota/i',
    ];

    /**
     * Sanitize an error message to remove sensitive information.
     * Returns a generic message if the original contains sensitive patterns.
     *
     * @param string $message The original error message
     * @param string $fallback The fallback message to use if sensitive content detected
     * @return string Safe message for user display
     */
    public static function sanitizeMessage(
        string $message,
        string $fallback = 'An unexpected error occurred. Please try again later.'
    ): string {
        // In debug mode, allow all messages (for development only)
        if (config('app.debug')) {
            return $message;
        }

        // Check for sensitive patterns
        foreach (self::$sensitivePatterns as $pattern) {
            if (preg_match($pattern, $message)) {
                return $fallback;
            }
        }

        // Also sanitize if message is too technical (contains stack-trace-like content)
        if (strlen($message) > 500 || preg_match('/\n.*\n/', $message)) {
            return $fallback;
        }

        return $message;
    }

    /**
     * Create a safe error response from an exception.
     * Logs the full error but returns sanitized message to user.
     *
     * @param Throwable $e The exception
     * @param string $fallbackMessage User-friendly message to show if original is sensitive
     * @param ErrorCode $errorCode Error code for the response
     * @param int $status HTTP status code
     * @return JsonResponse
     */
    public static function safeError(
        Throwable $e,
        string $fallbackMessage = 'An unexpected error occurred. Please try again later.',
        ErrorCode $errorCode = ErrorCode::INTERNAL_ERROR,
        int $status = 500
    ): JsonResponse {
        // Always log the full error for debugging
        AppLogger::default()->error('API Error: ' . $e->getMessage(), [
            'exception' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => array_slice($e->getTrace(), 0, 3),
        ]);

        // Sanitize the message before returning to user
        $safeMessage = self::sanitizeMessage($e->getMessage(), $fallbackMessage);

        return self::error($safeMessage, $errorCode, $status);
    }

    /**
     * Create a successful response
     */
    public static function success(
        mixed $data = null,
        string $message = 'Success',
        int $status = 200,
        array $meta = []
    ): JsonResponse {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        // Add metadata if provided
        if (!empty($meta)) {
            $response['meta'] = $meta;
        }

        // Add request ID for tracing
        $response['request_id'] = AppLogger::getRequestId();

        return response()->json($response, $status);
    }

    /**
     * Create a paginated response
     */
    public static function paginated(
        $paginator,
        string $message = 'Success'
    ): JsonResponse {
        return self::success(
            data: $paginator->items(),
            message: $message,
            meta: [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ]
        );
    }

    /**
     * Create an error response
     */
    public static function error(
        string $message,
        ErrorCode|string $errorCode = ErrorCode::UNKNOWN_ERROR,
        int $status = 0,
        ?array $errors = null,
        array $context = []
    ): JsonResponse {
        // Handle string error codes
        $code = $errorCode instanceof ErrorCode ? $errorCode : ErrorCode::tryFrom($errorCode) ?? ErrorCode::UNKNOWN_ERROR;

        // Use enum's HTTP status if not explicitly provided
        if ($status === 0) {
            $status = $code->httpStatus();
        }

        $response = [
            'success' => false,
            'message' => $message,
            'error_code' => $code->value,
            'request_id' => AppLogger::getRequestId(),
        ];

        // Add validation errors if present
        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        // Add debug info in non-production
        if (config('app.debug') && !empty($context)) {
            $response['debug'] = $context;
        }

        return response()->json($response, $status);
    }

    /**
     * Create error response from exception
     */
    public static function fromException(Throwable $e, ?string $fallbackMessage = null): JsonResponse
    {
        // Handle our custom exceptions
        if ($e instanceof BaseException) {
            return self::error(
                message: $e->getUserMessage(),
                errorCode: $e->getErrorCode(),
                status: $e->getHttpStatusCode(),
                context: $e->getContext()
            );
        }

        // Handle Laravel validation exceptions
        if ($e instanceof ValidationException) {
            return self::validationError($e->errors(), $e->getMessage());
        }

        // Handle Laravel's authentication exception
        if ($e instanceof \Illuminate\Auth\AuthenticationException) {
            return self::error(
                message: 'Authentication required.',
                errorCode: ErrorCode::AUTH_ERROR,
                status: 401
            );
        }

        // Handle model not found
        if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
            $model = class_basename($e->getModel());
            return self::error(
                message: "{$model} not found.",
                errorCode: ErrorCode::NOT_FOUND,
                status: 404
            );
        }

        // Handle HTTP exceptions
        if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
            return self::fromHttpException($e);
        }

        // Handle rate limiting
        if ($e instanceof \Illuminate\Http\Exceptions\ThrottleRequestsException) {
            return self::error(
                message: 'Too many requests. Please try again later.',
                errorCode: ErrorCode::RATE_LIMITED,
                status: 429
            );
        }

        // Handle connection exceptions (external services)
        if ($e instanceof \Illuminate\Http\Client\ConnectionException) {
            AppLogger::api()->error('External service connection failed', [
                'exception' => $e->getMessage(),
            ]);

            return self::error(
                message: 'External service is temporarily unavailable.',
                errorCode: ErrorCode::SERVICE_UNAVAILABLE,
                status: 502
            );
        }

        // Log unexpected exceptions
        AppLogger::default()->exception($e, 'Unhandled exception');

        // Generic error for unexpected exceptions
        $message = $fallbackMessage ?? 'An unexpected error occurred. Please try again later.';

        $response = [
            'success' => false,
            'message' => config('app.debug') ? $e->getMessage() : $message,
            'error_code' => ErrorCode::INTERNAL_ERROR->value,
            'request_id' => AppLogger::getRequestId(),
        ];

        // Add debug info in development
        if (config('app.debug')) {
            $response['debug'] = [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => array_slice($e->getTrace(), 0, 5),
            ];
        }

        return response()->json($response, 500);
    }

    /**
     * Create validation error response
     */
    public static function validationError(
        array $errors,
        string $message = 'The given data was invalid.'
    ): JsonResponse {
        return self::error(
            message: $message,
            errorCode: ErrorCode::VALIDATION_ERROR,
            status: 422,
            errors: $errors
        );
    }

    /**
     * Create not found response
     */
    public static function notFound(
        string $resource = 'Resource',
        mixed $identifier = null
    ): JsonResponse {
        $message = $identifier
            ? "{$resource} with ID '{$identifier}' not found."
            : "{$resource} not found.";

        return self::error(
            message: $message,
            errorCode: ErrorCode::NOT_FOUND,
            status: 404
        );
    }

    /**
     * Create unauthorized response
     */
    public static function unauthorized(string $message = 'Authentication required.'): JsonResponse
    {
        return self::error(
            message: $message,
            errorCode: ErrorCode::AUTH_ERROR,
            status: 401
        );
    }

    /**
     * Create forbidden response
     */
    public static function forbidden(string $message = 'Access denied.'): JsonResponse
    {
        return self::error(
            message: $message,
            errorCode: ErrorCode::FORBIDDEN,
            status: 403
        );
    }

    /**
     * Create rate limited response
     */
    public static function rateLimited(int $retryAfter = 60): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => "Too many requests. Please try again in {$retryAfter} seconds.",
            'error_code' => ErrorCode::RATE_LIMITED->value,
            'retry_after' => $retryAfter,
            'request_id' => AppLogger::getRequestId(),
        ], 429)->withHeaders([
            'Retry-After' => $retryAfter,
        ]);
    }

    /**
     * Create created response (201)
     */
    public static function created(mixed $data, string $message = 'Resource created successfully.'): JsonResponse
    {
        return self::success($data, $message, 201);
    }

    /**
     * Create no content response (204)
     */
    public static function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    /**
     * Create accepted response (202) for async operations
     */
    public static function accepted(
        string $message = 'Request accepted for processing.',
        ?string $trackingId = null
    ): JsonResponse {
        $data = ['status' => 'processing'];

        if ($trackingId) {
            $data['tracking_id'] = $trackingId;
        }

        return self::success($data, $message, 202);
    }

    /**
     * Handle HTTP exceptions
     */
    protected static function fromHttpException(\Symfony\Component\HttpKernel\Exception\HttpException $e): JsonResponse
    {
        $status = $e->getStatusCode();

        $errorCode = match ($status) {
            400 => ErrorCode::VALIDATION_ERROR,
            401 => ErrorCode::AUTH_ERROR,
            403 => ErrorCode::FORBIDDEN,
            404 => ErrorCode::NOT_FOUND,
            405 => ErrorCode::OPERATION_NOT_ALLOWED,
            422 => ErrorCode::VALIDATION_ERROR,
            429 => ErrorCode::RATE_LIMITED,
            500 => ErrorCode::INTERNAL_ERROR,
            502 => ErrorCode::EXTERNAL_SERVICE_ERROR,
            503 => ErrorCode::SERVICE_UNAVAILABLE,
            504 => ErrorCode::SERVICE_TIMEOUT,
            default => ErrorCode::UNKNOWN_ERROR,
        };

        $message = $e->getMessage() ?: $errorCode->userMessage();

        return self::error($message, $errorCode, $status);
    }
}
