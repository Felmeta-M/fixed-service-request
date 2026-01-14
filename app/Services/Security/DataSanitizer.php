<?php

namespace App\Services\Security;

use Illuminate\Support\Str;

/**
 * Data Sanitizer Service
 *
 * Provides utilities for sanitizing data for various contexts:
 * - Logging (mask sensitive data)
 * - API responses (hide internal details)
 * - Database storage (prevent injection)
 * - Display (prevent XSS)
 */
class DataSanitizer
{
    /**
     * Sensitive keys that should be masked
     */
    protected static array $sensitiveKeys = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'secret',
        'token',
        'api_key',
        'apikey',
        'access_token',
        'refresh_token',
        'bearer',
        'authorization',
        'private_key',
        'public_key',
        'credential',
        'otp',
        'pin',
        'code',
        'verification_code',
        'card_number',
        'cvv',
        'cvc',
        'ssn',
        'social_security',
        'bank_account',
        'routing_number',
        'credit_card',
        'debit_card',
    ];

    /**
     * Keys that should be partially masked (show last 4 chars)
     */
    protected static array $partialMaskKeys = [
        'phone',
        'phone_number',
        'mobile',
        'email',
        'customer_code',
        'account_number',
        'card_last_four',
    ];

    /**
     * Sanitize data for logging (mask sensitive fields)
     */
    public static function forLogging(mixed $data, int $maxDepth = 5): mixed
    {
        if ($maxDepth <= 0) {
            return '[MAX_DEPTH_EXCEEDED]';
        }

        if (is_array($data)) {
            return self::sanitizeArrayForLogging($data, $maxDepth);
        }

        if (is_object($data)) {
            if (method_exists($data, 'toArray')) {
                return self::sanitizeArrayForLogging($data->toArray(), $maxDepth);
            }
            return '[Object: ' . get_class($data) . ']';
        }

        if (is_string($data) && strlen($data) > 1000) {
            return Str::limit($data, 1000) . '...[TRUNCATED]';
        }

        return $data;
    }

    /**
     * Sanitize array for logging
     */
    protected static function sanitizeArrayForLogging(array $data, int $maxDepth): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string) $key);

            // Full mask for sensitive keys
            if (self::isSensitiveKey($lowerKey)) {
                $sanitized[$key] = '***REDACTED***';
                continue;
            }

            // Partial mask for identity fields
            if (self::isPartialMaskKey($lowerKey) && is_string($value)) {
                $sanitized[$key] = self::partialMask($value);
                continue;
            }

            // Recursively process arrays
            if (is_array($value)) {
                $sanitized[$key] = self::sanitizeArrayForLogging($value, $maxDepth - 1);
                continue;
            }

            // Truncate long strings
            if (is_string($value) && strlen($value) > 500) {
                $sanitized[$key] = Str::limit($value, 500) . '...[TRUNCATED]';
                continue;
            }

            $sanitized[$key] = $value;
        }

        return $sanitized;
    }

    /**
     * Check if key is sensitive
     */
    protected static function isSensitiveKey(string $key): bool
    {
        foreach (self::$sensitiveKeys as $sensitive) {
            if ($key === $sensitive || Str::contains($key, $sensitive)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if key should be partially masked
     */
    protected static function isPartialMaskKey(string $key): bool
    {
        foreach (self::$partialMaskKeys as $partial) {
            if ($key === $partial || Str::endsWith($key, $partial)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Partially mask a string (show last 4 characters)
     */
    public static function partialMask(string $value, int $visibleChars = 4): string
    {
        $length = strlen($value);

        if ($length <= $visibleChars) {
            return str_repeat('*', $length);
        }

        return str_repeat('*', $length - $visibleChars) . substr($value, -$visibleChars);
    }

    /**
     * Mask email address
     */
    public static function maskEmail(string $email): string
    {
        $parts = explode('@', $email);

        if (count($parts) !== 2) {
            return '***@***.***';
        }

        $local = $parts[0];
        $domain = $parts[1];

        $maskedLocal = strlen($local) > 2
            ? substr($local, 0, 2) . str_repeat('*', strlen($local) - 2)
            : str_repeat('*', strlen($local));

        $domainParts = explode('.', $domain);
        $maskedDomain = count($domainParts) > 1
            ? str_repeat('*', strlen($domainParts[0])) . '.' . end($domainParts)
            : str_repeat('*', strlen($domain));

        return $maskedLocal . '@' . $maskedDomain;
    }

    /**
     * Mask phone number
     */
    public static function maskPhone(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone);
        $length = strlen($digits);

        if ($length <= 4) {
            return str_repeat('*', $length);
        }

        return str_repeat('*', $length - 4) . substr($digits, -4);
    }

    /**
     * Sanitize for HTML display (prevent XSS)
     */
    public static function forDisplay(mixed $value): mixed
    {
        if (is_string($value)) {
            return htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        if (is_array($value)) {
            return array_map([self::class, 'forDisplay'], $value);
        }

        return $value;
    }

    /**
     * Sanitize for JSON API response
     */
    public static function forApiResponse(array $data, array $sensitiveFields = []): array
    {
        $fields = array_merge(self::$sensitiveKeys, $sensitiveFields);

        return self::removeFields($data, $fields);
    }

    /**
     * Remove specific fields from array recursively
     */
    public static function removeFields(array $data, array $fields): array
    {
        foreach ($data as $key => $value) {
            if (in_array(strtolower($key), array_map('strtolower', $fields))) {
                unset($data[$key]);
                continue;
            }

            if (is_array($value)) {
                $data[$key] = self::removeFields($value, $fields);
            }
        }

        return $data;
    }

    /**
     * Sanitize SQL LIKE input (escape wildcards)
     */
    public static function escapeLike(string $value): string
    {
        return str_replace(
            ['%', '_', '\\'],
            ['\\%', '\\_', '\\\\'],
            $value
        );
    }

    /**
     * Sanitize file name
     */
    public static function sanitizeFileName(string $fileName): string
    {
        // Remove path traversal characters
        $fileName = str_replace(['../', '..\\', '/', '\\'], '', $fileName);

        // Remove null bytes
        $fileName = str_replace(chr(0), '', $fileName);

        // Keep only safe characters
        $fileName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $fileName);

        // Limit length
        if (strlen($fileName) > 255) {
            $extension = pathinfo($fileName, PATHINFO_EXTENSION);
            $name = pathinfo($fileName, PATHINFO_FILENAME);
            $fileName = substr($name, 0, 250 - strlen($extension)) . '.' . $extension;
        }

        return $fileName;
    }

    /**
     * Add custom sensitive keys
     */
    public static function addSensitiveKeys(array $keys): void
    {
        self::$sensitiveKeys = array_merge(self::$sensitiveKeys, $keys);
    }
}
