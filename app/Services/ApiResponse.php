<?php

namespace App\Services;

use Illuminate\Http\JsonResponse;
use Throwable;

class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'OK', int $status = 200, $success = true): JsonResponse
    {
        return response()->json([
            'success' => $success,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    public static function error(string $message = 'Something went wrong.', int $status = 500, mixed $errors = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
        ], $status);
    }

    public static function exception(Throwable $e, string $fallbackMessage = 'Server Error'): JsonResponse
    {
        // Log full details for backend visibility
        \Log::error($e->getMessage(), [
            'exception' => $e,
        ]);

        // Send safe response for frontend
        return self::error($fallbackMessage, 500);
    }
}
