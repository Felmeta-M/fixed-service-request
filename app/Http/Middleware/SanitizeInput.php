<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Input Sanitization Middleware
 *
 * Sanitizes incoming request data to prevent XSS and injection attacks.
 * Applied globally to all requests.
 */
class SanitizeInput
{
    /**
     * Fields that should NOT be sanitized (passwords, content, etc.)
     */
    protected array $except = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'content',
        'body',
        'description',
        'message',
        'html',
        'xml',
        '_token',
    ];

    /**
     * Fields that should only be trimmed, not stripped
     */
    protected array $trimOnly = [
        'email',
        'url',
        'website',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();
        $sanitized = $this->sanitizeArray($input);
        $request->merge($sanitized);

        return $next($request);
    }

    /**
     * Sanitize an array recursively
     */
    protected function sanitizeArray(array $data, string $prefix = ''): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            $fullKey = $prefix ? "{$prefix}.{$key}" : $key;

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeArray($value, $fullKey);
            } elseif (is_string($value)) {
                $sanitized[$key] = $this->sanitizeValue($key, $value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Sanitize a single value
     */
    protected function sanitizeValue(string $key, string $value): string
    {
        // Skip excepted fields
        if ($this->shouldSkip($key)) {
            return $value;
        }

        // Only trim certain fields
        if ($this->shouldTrimOnly($key)) {
            return trim($value);
        }

        // Full sanitization
        $value = trim($value);

        // Remove null bytes
        $value = str_replace(chr(0), '', $value);

        // Strip HTML tags (except allowed)
        $value = strip_tags($value);

        // Convert special characters to HTML entities
        $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);

        // Decode back (we just want to neutralize, not double-encode)
        $value = htmlspecialchars_decode($value, ENT_QUOTES);

        // Remove potential SQL injection characters from non-query fields
        if (!$this->isQueryField($key)) {
            $value = $this->removeSqlInjectionPatterns($value);
        }

        return $value;
    }

    /**
     * Check if field should be skipped
     */
    protected function shouldSkip(string $key): bool
    {
        $key = strtolower($key);

        foreach ($this->except as $except) {
            if ($key === strtolower($except) || Str::endsWith($key, '.' . strtolower($except))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if field should only be trimmed
     */
    protected function shouldTrimOnly(string $key): bool
    {
        return in_array(strtolower($key), array_map('strtolower', $this->trimOnly));
    }

    /**
     * Check if field is used for search queries
     */
    protected function isQueryField(string $key): bool
    {
        $queryFields = ['search', 'query', 'q', 'filter', 'keyword'];
        return in_array(strtolower($key), $queryFields);
    }

    /**
     * Remove common SQL injection patterns
     */
    protected function removeSqlInjectionPatterns(string $value): string
    {
        // Remove common SQL injection patterns
        $patterns = [
            '/\bunion\b.*\bselect\b/i',
            '/\bselect\b.*\bfrom\b/i',
            '/\binsert\b.*\binto\b/i',
            '/\bdelete\b.*\bfrom\b/i',
            '/\bdrop\b.*\btable\b/i',
            '/\bexec\b.*\(/i',
            '/\bexecute\b.*\(/i',
            '/--/',
            '/\/\*.*\*\//',
        ];

        foreach ($patterns as $pattern) {
            $value = preg_replace($pattern, '', $value);
        }

        return $value;
    }
}
