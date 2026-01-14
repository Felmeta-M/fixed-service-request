<?php

namespace App\Services\Logging;

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Database Query Logger for performance monitoring and debugging.
 *
 * Features:
 * - Logs slow queries (configurable threshold)
 * - Logs all queries in debug mode
 * - Detects N+1 query patterns
 * - Tracks query count per request
 * - Masks sensitive data in queries
 */
class QueryLogger
{
    protected static array $queries = [];
    protected static bool $enabled = false;
    protected static int $slowThreshold = 1000; // milliseconds
    protected static bool $detectN1 = true;

    /**
     * Enable query logging
     */
    public static function enable(): void
    {
        if (self::$enabled) {
            return;
        }

        self::$enabled = true;
        self::$queries = [];
        self::$slowThreshold = (int) config('logging.query_slow_threshold', 1000);
        self::$detectN1 = (bool) config('logging.query_detect_n1', true);

        DB::listen(function (QueryExecuted $query) {
            self::handleQuery($query);
        });
    }

    /**
     * Disable query logging
     */
    public static function disable(): void
    {
        self::$enabled = false;
    }

    /**
     * Handle a query execution event
     */
    protected static function handleQuery(QueryExecuted $query): void
    {
        $sql = self::maskSensitiveData($query->sql);
        $time = $query->time;
        $connection = $query->connectionName;

        // Store for N+1 detection and summary
        $queryKey = self::normalizeQuery($sql);
        if (!isset(self::$queries[$queryKey])) {
            self::$queries[$queryKey] = [
                'sql' => $sql,
                'count' => 0,
                'total_time' => 0,
                'max_time' => 0,
            ];
        }
        self::$queries[$queryKey]['count']++;
        self::$queries[$queryKey]['total_time'] += $time;
        self::$queries[$queryKey]['max_time'] = max(self::$queries[$queryKey]['max_time'], $time);

        // Log slow queries immediately
        if ($time >= self::$slowThreshold) {
            AppLogger::performance()->warning('Slow database query detected', [
                'sql' => $sql,
                'bindings' => self::maskBindings($query->bindings),
                'time_ms' => round($time, 2),
                'connection' => $connection,
                'threshold_ms' => self::$slowThreshold,
            ]);
        }

        // Debug level logging for all queries (only in debug mode)
        if (config('app.debug') && config('logging.query_log_all', false)) {
            Log::channel('daily')->debug('DB Query', [
                'sql' => Str::limit($sql, 500),
                'time_ms' => round($time, 2),
                'connection' => $connection,
            ]);
        }
    }

    /**
     * Get query statistics for the current request
     */
    public static function getStats(): array
    {
        $totalQueries = 0;
        $totalTime = 0;
        $slowQueries = 0;
        $n1Candidates = [];

        foreach (self::$queries as $key => $data) {
            $totalQueries += $data['count'];
            $totalTime += $data['total_time'];

            if ($data['max_time'] >= self::$slowThreshold) {
                $slowQueries++;
            }

            // N+1 detection: same query executed more than 3 times
            if (self::$detectN1 && $data['count'] > 3) {
                $n1Candidates[] = [
                    'sql' => Str::limit($data['sql'], 200),
                    'count' => $data['count'],
                    'total_time_ms' => round($data['total_time'], 2),
                ];
            }
        }

        return [
            'total_queries' => $totalQueries,
            'unique_queries' => count(self::$queries),
            'total_time_ms' => round($totalTime, 2),
            'slow_queries' => $slowQueries,
            'n1_candidates' => $n1Candidates,
        ];
    }

    /**
     * Log request summary (call at end of request)
     */
    public static function logSummary(): void
    {
        if (!self::$enabled || empty(self::$queries)) {
            return;
        }

        $stats = self::getStats();

        // Log N+1 warnings
        if (!empty($stats['n1_candidates'])) {
            AppLogger::performance()->warning('Potential N+1 query detected', [
                'candidates' => $stats['n1_candidates'],
            ]);
        }

        // Log summary for requests with many queries
        if ($stats['total_queries'] > 50 || $stats['total_time_ms'] > 2000) {
            AppLogger::performance()->info('Database query summary', [
                'total_queries' => $stats['total_queries'],
                'unique_queries' => $stats['unique_queries'],
                'total_time_ms' => $stats['total_time_ms'],
                'slow_queries' => $stats['slow_queries'],
            ]);
        }

        // Reset for next request
        self::$queries = [];
    }

    /**
     * Normalize query for grouping (remove specific values)
     */
    protected static function normalizeQuery(string $sql): string
    {
        // Replace numeric values
        $normalized = preg_replace('/\b\d+\b/', '?', $sql);

        // Replace quoted strings
        $normalized = preg_replace('/\'[^\']*\'/', '?', $normalized);
        $normalized = preg_replace('/"[^"]*"/', '?', $normalized);

        // Replace multiple whitespace
        $normalized = preg_replace('/\s+/', ' ', $normalized);

        return trim($normalized);
    }

    /**
     * Mask sensitive data in SQL queries
     */
    protected static function maskSensitiveData(string $sql): string
    {
        $patterns = [
            // Password patterns
            '/password\s*=\s*\'[^\']*\'/i' => "password='***'",
            '/password\s*=\s*"[^"]*"/i' => 'password="***"',

            // Token patterns
            '/token\s*=\s*\'[^\']*\'/i' => "token='***'",
            '/api_key\s*=\s*\'[^\']*\'/i' => "api_key='***'",

            // OTP patterns
            '/otp\s*=\s*\'[^\']*\'/i' => "otp='***'",
            '/verification_code\s*=\s*\'[^\']*\'/i' => "verification_code='***'",
        ];

        foreach ($patterns as $pattern => $replacement) {
            $sql = preg_replace($pattern, $replacement, $sql);
        }

        return $sql;
    }

    /**
     * Mask sensitive bindings
     */
    protected static function maskBindings(array $bindings): array
    {
        // For production, don't log bindings at all
        if (app()->isProduction()) {
            return ['[REDACTED]'];
        }

        $sensitiveKeys = ['password', 'token', 'secret', 'otp', 'api_key', 'pin'];

        return array_map(function ($binding) use ($sensitiveKeys) {
            if (is_string($binding)) {
                foreach ($sensitiveKeys as $key) {
                    if (stripos($binding, $key) !== false) {
                        return '***';
                    }
                }
                // Truncate long strings
                return Str::limit($binding, 100);
            }
            return $binding;
        }, $bindings);
    }
}
