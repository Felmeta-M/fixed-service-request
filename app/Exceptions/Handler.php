<?php

namespace App\Exceptions;

use App\Enums\ErrorCode;
use App\Services\ApiResponse;
use App\Services\Logging\AppLogger;
use Illuminate\Auth\AuthenticationException as LaravelAuthException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException as LaravelValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;
use Inertia\Inertia;

/**
 * Professional exception handler with:
 * - Consistent API error responses
 * - Proper logging by exception type
 * - Debug information in development
 * - Request ID tracking
 */
class Handler extends ExceptionHandler
{
    /**
     * Exception types with custom log levels
     */
    protected $levels = [
        \PDOException::class => 'critical',
        \RedisException::class => 'critical',
        ConnectionException::class => 'error',
        ExternalServiceException::class => 'error',
        PaymentException::class => 'error',
    ];

    /**
     * Exception types that are not reported (logged)
     */
    protected $dontReport = [
        LaravelAuthException::class,
        LaravelValidationException::class,
        TokenMismatchException::class,
        ModelNotFoundException::class,
        NotFoundHttpException::class,
        MethodNotAllowedHttpException::class,
        ThrottleRequestsException::class,
        // Our custom client-error exceptions
        ValidationException::class,
        NotFoundException::class,
        AuthenticationException::class,
        AuthorizationException::class,
    ];

    /**
     * Inputs never flashed to session
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
        'otp',
        'pin',
        'token',
        'secret',
        'api_key',
        'card_number',
        'cvv',
    ];

    /**
     * Register exception handling callbacks
     */
    public function register(): void
    {
        // Custom rendering for API requests
        $this->renderable(function (Throwable $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return $this->renderApiException($e, $request);
            }
            
            // Handle web/Inertia requests with proper error pages
            return $this->renderInertiaException($e, $request);
        });

        // Additional reporting (Sentry, Bugsnag, etc.)
        $this->reportable(function (Throwable $e) {
            // Add external error tracking here if needed
            // Example: \Sentry\captureException($e);
        });
    }
    
    /**
     * Render exception as Inertia error page for web requests
     */
    protected function renderInertiaException(Throwable $e, Request $request): ?Response
    {
        // Determine status code
        $status = 500;
        $title = 'Server Error';
        $message = 'An unexpected error occurred. Please try again later.';
        
        if ($e instanceof NotFoundHttpException) {
            $status = 404;
            $title = 'Page Not Found';
            $message = 'The page you are looking for could not be found.';
        } elseif ($e instanceof ModelNotFoundException) {
            $status = 404;
            $title = 'Not Found';
            $model = class_basename($e->getModel());
            $message = "The requested {$model} could not be found.";
        } elseif ($e instanceof LaravelAuthException) {
            $status = 401;
            $title = 'Unauthorized';
            $message = 'Please log in to access this page.';
        } elseif ($e instanceof MethodNotAllowedHttpException) {
            $status = 405;
            $title = 'Method Not Allowed';
            $message = 'The requested action is not allowed.';
        } elseif ($e instanceof ThrottleRequestsException) {
            $status = 429;
            $title = 'Too Many Requests';
            $message = 'You have made too many requests. Please wait a moment and try again.';
        } elseif ($e instanceof TokenMismatchException) {
            $status = 419;
            $title = 'Session Expired';
            $message = 'Your session has expired. Please refresh the page and try again.';
        } elseif ($e instanceof HttpException) {
            $status = $e->getStatusCode();
            $title = $this->getHttpStatusTitle($status);
            $message = $e->getMessage() ?: $this->getHttpStatusMessage($status);
        }
        
        // For non-HTTP exceptions in production, show generic error
        if (!config('app.debug') && $status === 500) {
            $message = 'An unexpected error occurred. Please try again later.';
        } elseif (config('app.debug') && $status === 500) {
            $message = $e->getMessage();
        }
        
        return Inertia::render('errors/error', [
            'status' => $status,
            'title' => $title,
            'message' => $message,
        ])->toResponse($request)->setStatusCode($status);
    }
    
    /**
     * Get human-readable title for HTTP status codes
     */
    protected function getHttpStatusTitle(int $status): string
    {
        return match ($status) {
            400 => 'Bad Request',
            401 => 'Unauthorized',
            403 => 'Forbidden',
            404 => 'Page Not Found',
            405 => 'Method Not Allowed',
            408 => 'Request Timeout',
            419 => 'Session Expired',
            422 => 'Unprocessable Entity',
            429 => 'Too Many Requests',
            500 => 'Server Error',
            502 => 'Bad Gateway',
            503 => 'Service Unavailable',
            504 => 'Gateway Timeout',
            default => 'Error',
        };
    }
    
    /**
     * Get human-readable message for HTTP status codes
     */
    protected function getHttpStatusMessage(int $status): string
    {
        return match ($status) {
            400 => 'The request could not be understood by the server.',
            401 => 'Please log in to access this page.',
            403 => 'You do not have permission to access this page.',
            404 => 'The page you are looking for could not be found.',
            405 => 'The requested action is not allowed.',
            408 => 'The request took too long to complete.',
            419 => 'Your session has expired. Please refresh the page.',
            422 => 'The submitted data was invalid.',
            429 => 'You have made too many requests. Please wait.',
            500 => 'An unexpected error occurred. Please try again later.',
            502 => 'The server received an invalid response.',
            503 => 'The service is temporarily unavailable. Please try again later.',
            504 => 'The server took too long to respond.',
            default => 'An error occurred. Please try again.',
        };
    }

    /**
     * Report exception to logs
     */
    public function report(Throwable $e): void
    {
        if ($this->shouldntReport($e)) {
            return;
        }

        $this->logException($e);
    }

    /**
     * Render exception as API response
     */
    protected function renderApiException(Throwable $e, Request $request): JsonResponse
    {
        // Handle our custom base exceptions
        if ($e instanceof BaseException) {
            return $this->renderCustomException($e);
        }

        // Handle Laravel's validation exception
        if ($e instanceof LaravelValidationException) {
            return ApiResponse::validationError($e->errors(), $e->getMessage());
        }

        // Handle Laravel's authentication exception
        // For API requests, provide a friendly message instead of "Unauthenticated"
        if ($e instanceof LaravelAuthException) {
            // Check if this is a public endpoint that doesn't require auth
            $publicEndpoints = ['tt/create-guest', 'tt/lookup-service'];
            $currentPath = $request->path();
            
            foreach ($publicEndpoints as $endpoint) {
                if (str_contains($currentPath, $endpoint)) {
                    // This shouldn't happen on public endpoints, but if it does,
                    // return a generic error instead of auth error
                    return ApiResponse::error(
                        message: 'Unable to process request. Please try again.',
                        errorCode: ErrorCode::INTERNAL_ERROR,
                        status: 500
                    );
                }
            }
            
            return ApiResponse::unauthorized('Please log in to access this feature.');
        }

        // Handle model not found
        if ($e instanceof ModelNotFoundException) {
            $model = class_basename($e->getModel());
            return ApiResponse::notFound($model, $e->getIds()[0] ?? null);
        }

        // Handle 404 routes
        if ($e instanceof NotFoundHttpException) {
            return ApiResponse::error(
                message: 'The requested endpoint was not found.',
                errorCode: ErrorCode::NOT_FOUND,
                status: 404
            );
        }

        // Handle method not allowed
        if ($e instanceof MethodNotAllowedHttpException) {
            return ApiResponse::error(
                message: 'HTTP method not allowed for this endpoint.',
                errorCode: ErrorCode::OPERATION_NOT_ALLOWED,
                status: 405
            );
        }

        // Handle rate limiting
        if ($e instanceof ThrottleRequestsException) {
            $retryAfter = $e->getHeaders()['Retry-After'] ?? 60;
            return ApiResponse::rateLimited((int) $retryAfter);
        }

        // Handle CSRF token mismatch
        if ($e instanceof TokenMismatchException) {
            return ApiResponse::error(
                message: 'Session expired. Please refresh and try again.',
                errorCode: ErrorCode::SESSION_EXPIRED,
                status: 419
            );
        }

        // Handle HTTP exceptions
        if ($e instanceof HttpException) {
            return $this->renderApiHttpException($e);
        }

        // Handle connection exceptions (external services)
        if ($e instanceof ConnectionException) {
            return ApiResponse::error(
                message: 'External service is temporarily unavailable.',
                errorCode: ErrorCode::SERVICE_UNAVAILABLE,
                status: 502
            );
        }

        // Handle database exceptions
        if ($e instanceof \PDOException) {
            AppLogger::default()->critical('Database error', [
                'exception' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);

            return ApiResponse::error(
                message: 'A database error occurred. Please try again later.',
                errorCode: ErrorCode::INTERNAL_ERROR,
                status: 500
            );
        }

        // Default: unexpected exception
        return ApiResponse::fromException($e);
    }

    /**
     * Render our custom exceptions
     */
    protected function renderCustomException(BaseException $e): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $e->getUserMessage(),
            'error_code' => $e->getErrorCode(),
            'request_id' => AppLogger::getRequestId(),
        ];

        // Add validation errors for validation exceptions
        if ($e instanceof ValidationException) {
            $response['errors'] = $e->getErrors();
        }

        // Add retry-after for rate limiting
        if ($e instanceof ExternalServiceException && $e->getErrorCode() === 'SERVICE_RATE_LIMITED') {
            $retryAfter = $e->getContext()['retry_after'] ?? 60;
            return response()->json($response, $e->getHttpStatusCode())
                ->withHeaders(['Retry-After' => $retryAfter]);
        }

        // Add debug info in development
        if (config('app.debug')) {
            $response['debug'] = [
                'exception' => get_class($e),
                'developer_message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'context' => $e->getContext(),
            ];
        }

        return response()->json($response, $e->getHttpStatusCode());
    }

    /**
     * Render HTTP exceptions for API responses
     */
    protected function renderApiHttpException(HttpException $e): JsonResponse
    {
        $status = $e->getStatusCode();

        $errorCode = match ($status) {
            400 => ErrorCode::VALIDATION_ERROR,
            401 => ErrorCode::AUTH_ERROR,
            403 => ErrorCode::FORBIDDEN,
            404 => ErrorCode::NOT_FOUND,
            405 => ErrorCode::OPERATION_NOT_ALLOWED,
            408 => ErrorCode::SERVICE_TIMEOUT,
            409 => ErrorCode::DUPLICATE_RESOURCE,
            422 => ErrorCode::VALIDATION_ERROR,
            429 => ErrorCode::RATE_LIMITED,
            500 => ErrorCode::INTERNAL_ERROR,
            502 => ErrorCode::EXTERNAL_SERVICE_ERROR,
            503 => ErrorCode::SERVICE_UNAVAILABLE,
            504 => ErrorCode::SERVICE_TIMEOUT,
            default => ErrorCode::UNKNOWN_ERROR,
        };

        $message = $e->getMessage() ?: $errorCode->userMessage();

        return ApiResponse::error($message, $errorCode, $status);
    }

    /**
     * Log exception with appropriate channel and context
     */
    protected function logException(Throwable $e): void
    {
        $context = $this->buildExceptionContext($e);
        $logger = $this->determineLogger($e);
        $level = $this->determineLevel($e);

        $message = sprintf(
            '[%s] %s in %s:%d',
            class_basename($e),
            $e->getMessage(),
            $e->getFile(),
            $e->getLine()
        );

        $logger->{$level}($message, $context);
    }

    /**
     * Build context array for exception logging
     */
    protected function buildExceptionContext(Throwable $e): array
    {
        $context = [
            'exception' => [
                'class' => get_class($e),
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ],
            'trace' => $this->formatTrace($e),
        ];

        // Add previous exception
        if ($previous = $e->getPrevious()) {
            $context['previous'] = [
                'class' => get_class($previous),
                'message' => $previous->getMessage(),
                'file' => $previous->getFile(),
                'line' => $previous->getLine(),
            ];
        }

        // Add custom exception context
        if ($e instanceof BaseException) {
            $context['custom_context'] = $e->getContext();
        }

        // Add HTTP context
        if ($e instanceof HttpException) {
            $context['http'] = [
                'status_code' => $e->getStatusCode(),
                'headers' => $e->getHeaders(),
            ];
        }

        // Add external service context
        if ($e instanceof ExternalServiceException) {
            $context['external_service'] = [
                'service' => $e->getService(),
                'status_code' => $e->getServiceStatusCode(),
            ];
        }

        // Add payment context
        if ($e instanceof PaymentException) {
            $context['payment'] = [
                'transaction_id' => $e->getTransactionId(),
                'gateway_code' => $e->getGatewayCode(),
            ];
        }

        return $context;
    }

    /**
     * Format stack trace for logging
     */
    protected function formatTrace(Throwable $e): array
    {
        $trace = [];
        foreach (array_slice($e->getTrace(), 0, 15) as $frame) {
            $trace[] = sprintf(
                '%s%s%s() at %s:%d',
                $frame['class'] ?? '',
                $frame['type'] ?? '',
                $frame['function'] ?? 'unknown',
                basename($frame['file'] ?? 'unknown'),
                $frame['line'] ?? 0
            );
        }
        return $trace;
    }

    /**
     * Determine which logger to use
     */
    protected function determineLogger(Throwable $e): AppLogger
    {
        // Security exceptions
        if ($e instanceof AuthenticationException ||
            $e instanceof AuthorizationException ||
            $e instanceof LaravelAuthException ||
            $e instanceof TokenMismatchException) {
            return AppLogger::security();
        }

        // Payment exceptions
        if ($e instanceof PaymentException) {
            return AppLogger::payment();
        }

        // External service exceptions
        if ($e instanceof ExternalServiceException ||
            $e instanceof ConnectionException) {
            return AppLogger::api();
        }

        // Business logic exceptions
        if ($e instanceof BusinessException) {
            return AppLogger::business();
        }

        // API/Service exceptions
        if (str_contains($e->getFile(), 'Services/')) {
            return AppLogger::api();
        }

        return AppLogger::default();
    }

    /**
     * Determine log level
     */
    protected function determineLevel(Throwable $e): string
    {
        // Check explicit levels
        foreach ($this->levels as $class => $level) {
            if ($e instanceof $class) {
                return $level;
            }
        }

        // Critical: Infrastructure issues
        if ($e instanceof \PDOException ||
            $e instanceof \RedisException) {
            return 'critical';
        }

        // Error: Business and service failures
        if ($e instanceof BusinessException ||
            $e instanceof ExternalServiceException ||
            $e instanceof PaymentException ||
            $e instanceof ConnectionException) {
            return 'error';
        }

        // Warning: Client errors
        if ($e instanceof HttpException && $e->getStatusCode() < 500) {
            return 'warning';
        }

        return 'error';
    }
}
