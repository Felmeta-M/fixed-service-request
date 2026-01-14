<?php

namespace App\Traits;

use App\Enums\ErrorCode;
use App\Exceptions\AuthenticationException;
use App\Exceptions\AuthorizationException;
use App\Exceptions\BusinessException;
use App\Exceptions\ExternalServiceException;
use App\Exceptions\NotFoundException;
use App\Exceptions\PaymentException;
use App\Exceptions\ValidationException;
use App\Services\ApiResponse;
use App\Services\Logging\AppLogger;
use Illuminate\Http\JsonResponse;
use Throwable;

/**
 * Trait for consistent exception handling in API controllers.
 *
 * Usage:
 *   class MyController extends Controller
 *   {
 *       use HandlesApiExceptions;
 *
 *       public function store(Request $request)
 *       {
 *           return $this->handleRequest(function () use ($request) {
 *               // Your logic here
 *               return ApiResponse::created($data);
 *           });
 *       }
 *   }
 */
trait HandlesApiExceptions
{
    /**
     * Execute a request handler with proper exception handling
     */
    protected function handleRequest(callable $handler, ?string $context = null): JsonResponse
    {
        try {
            return $handler();
        } catch (ValidationException $e) {
            return $this->handleValidationException($e);
        } catch (NotFoundException $e) {
            return $this->handleNotFoundException($e);
        } catch (AuthenticationException $e) {
            return $this->handleAuthenticationException($e);
        } catch (AuthorizationException $e) {
            return $this->handleAuthorizationException($e);
        } catch (BusinessException $e) {
            return $this->handleBusinessException($e, $context);
        } catch (PaymentException $e) {
            return $this->handlePaymentException($e, $context);
        } catch (ExternalServiceException $e) {
            return $this->handleExternalServiceException($e, $context);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return ApiResponse::validationError($e->errors(), $e->getMessage());
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            $model = class_basename($e->getModel());
            return ApiResponse::notFound($model, $e->getIds()[0] ?? null);
        } catch (\Illuminate\Database\QueryException $e) {
            return $this->handleDatabaseException($e, $context);
        } catch (Throwable $e) {
            return $this->handleUnexpectedException($e, $context);
        }
    }

    /**
     * Handle validation exception
     */
    protected function handleValidationException(ValidationException $e): JsonResponse
    {
        return ApiResponse::error(
            message: $e->getUserMessage(),
            errorCode: $e->getErrorCode(),
            status: $e->getHttpStatusCode(),
            errors: $e->getErrors()
        );
    }

    /**
     * Handle not found exception
     */
    protected function handleNotFoundException(NotFoundException $e): JsonResponse
    {
        return ApiResponse::notFound($e->getResource(), $e->getIdentifier());
    }

    /**
     * Handle authentication exception
     */
    protected function handleAuthenticationException(AuthenticationException $e): JsonResponse
    {
        AppLogger::security()->warning('Authentication failed', [
            'error_code' => $e->getErrorCode(),
            'context' => $e->getContext(),
        ]);

        return ApiResponse::error(
            message: $e->getUserMessage(),
            errorCode: $e->getErrorCode(),
            status: $e->getHttpStatusCode()
        );
    }

    /**
     * Handle authorization exception
     */
    protected function handleAuthorizationException(AuthorizationException $e): JsonResponse
    {
        AppLogger::security()->warning('Authorization denied', [
            'error_code' => $e->getErrorCode(),
            'context' => $e->getContext(),
        ]);

        return ApiResponse::error(
            message: $e->getUserMessage(),
            errorCode: $e->getErrorCode(),
            status: $e->getHttpStatusCode()
        );
    }

    /**
     * Handle business exception
     */
    protected function handleBusinessException(BusinessException $e, ?string $context = null): JsonResponse
    {
        AppLogger::business()->warning($e->getMessage(), [
            'error_code' => $e->getErrorCode(),
            'context' => $e->getContext(),
            'handler_context' => $context,
        ]);

        return ApiResponse::error(
            message: $e->getUserMessage(),
            errorCode: $e->getErrorCode(),
            status: $e->getHttpStatusCode()
        );
    }

    /**
     * Handle payment exception
     */
    protected function handlePaymentException(PaymentException $e, ?string $context = null): JsonResponse
    {
        AppLogger::payment()->error($e->getMessage(), [
            'error_code' => $e->getErrorCode(),
            'transaction_id' => $e->getTransactionId(),
            'gateway_code' => $e->getGatewayCode(),
            'context' => $e->getContext(),
            'handler_context' => $context,
        ]);

        return ApiResponse::error(
            message: $e->getUserMessage(),
            errorCode: $e->getErrorCode(),
            status: $e->getHttpStatusCode()
        );
    }

    /**
     * Handle external service exception
     */
    protected function handleExternalServiceException(ExternalServiceException $e, ?string $context = null): JsonResponse
    {
        AppLogger::api()->error($e->getMessage(), [
            'service' => $e->getService(),
            'error_code' => $e->getErrorCode(),
            'service_status_code' => $e->getServiceStatusCode(),
            'context' => $e->getContext(),
            'handler_context' => $context,
        ]);

        return ApiResponse::error(
            message: $e->getUserMessage(),
            errorCode: $e->getErrorCode(),
            status: $e->getHttpStatusCode()
        );
    }

    /**
     * Handle database exception
     */
    protected function handleDatabaseException(\Illuminate\Database\QueryException $e, ?string $context = null): JsonResponse
    {
        AppLogger::default()->error('Database query error', [
            'exception' => $e->getMessage(),
            'code' => $e->getCode(),
            'handler_context' => $context,
        ]);

        // Handle specific database errors
        $errorCode = $e->getCode();

        // Duplicate entry
        if ($errorCode === '23000' || str_contains($e->getMessage(), 'Duplicate entry')) {
            return ApiResponse::error(
                message: 'A record with this information already exists.',
                errorCode: ErrorCode::DUPLICATE_RESOURCE,
                status: 409
            );
        }

        // Foreign key constraint
        if (str_contains($e->getMessage(), 'foreign key constraint')) {
            return ApiResponse::error(
                message: 'Cannot complete operation due to related records.',
                errorCode: ErrorCode::BUSINESS_ERROR,
                status: 422
            );
        }

        return ApiResponse::error(
            message: 'A database error occurred. Please try again later.',
            errorCode: ErrorCode::INTERNAL_ERROR,
            status: 500
        );
    }

    /**
     * Handle unexpected exception
     */
    protected function handleUnexpectedException(Throwable $e, ?string $context = null): JsonResponse
    {
        AppLogger::default()->exception($e, "Unexpected error in {$context}");

        $message = config('app.debug')
            ? $e->getMessage()
            : 'An unexpected error occurred. Please try again later.';

        $response = [
            'success' => false,
            'message' => $message,
            'error_code' => ErrorCode::INTERNAL_ERROR->value,
            'request_id' => AppLogger::getRequestId(),
        ];

        if (config('app.debug')) {
            $response['debug'] = [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'handler_context' => $context,
            ];
        }

        return response()->json($response, 500);
    }

    /**
     * Shorthand to throw a business exception
     */
    protected function throwBusinessError(
        string $message,
        string $errorCode = 'BUSINESS_ERROR',
        array $context = [],
        ?string $userMessage = null
    ): never {
        throw new BusinessException($message, $errorCode, $context, $userMessage);
    }

    /**
     * Shorthand to throw a not found exception
     */
    protected function throwNotFound(string $resource, mixed $identifier = null): never
    {
        throw new NotFoundException($resource, $identifier);
    }

    /**
     * Shorthand to throw a validation exception
     */
    protected function throwValidation(array $errors, string $message = 'Validation failed'): never
    {
        throw new ValidationException($message, $errors);
    }
}
