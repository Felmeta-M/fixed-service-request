<?php

namespace App\Services\Logging;

use Monolog\Formatter\JsonFormatter as BaseJsonFormatter;
use Monolog\LogRecord;

/**
 * Custom JSON formatter for structured logging.
 *
 * Outputs logs in a format compatible with:
 * - ELK Stack (Elasticsearch, Logstash, Kibana)
 * - Datadog
 * - CloudWatch
 * - Grafana Loki
 * - Any JSON log aggregator
 *
 * Example output:
 * {
 *   "@timestamp": "2024-01-15T10:30:45.123456Z",
 *   "level": "error",
 *   "level_name": "ERROR",
 *   "channel": "api",
 *   "message": "API call failed",
 *   "context": {...},
 *   "app": {
 *     "name": "fixed-service-request",
 *     "environment": "production",
 *     "version": "1.0.0"
 *   }
 * }
 */
class JsonLogFormatter extends BaseJsonFormatter
{
    protected string $appName;
    protected string $environment;
    protected string $version;

    public function __construct(
        int $batchMode = self::BATCH_MODE_JSON,
        bool $appendNewline = true,
        bool $ignoreEmptyContextAndExtra = true,
        bool $includeStacktraces = true
    ) {
        parent::__construct($batchMode, $appendNewline, $ignoreEmptyContextAndExtra, $includeStacktraces);

        $this->appName = config('app.name', 'laravel');
        $this->environment = config('app.env', 'production');
        $this->version = config('app.version', '1.0.0');
    }

    /**
     * Format the log record into a structured JSON string
     */
    public function format(LogRecord $record): string
    {
        $data = $this->normalize($record);

        return $this->toJson($this->restructure($data)) . ($this->appendNewline ? "\n" : '');
    }

    /**
     * Restructure the log data for better readability and compatibility
     */
    protected function restructure(array $data): array
    {
        $structured = [
            // ISO 8601 timestamp with microseconds (ELK compatible)
            '@timestamp' => $data['datetime'] ?? now()->toIso8601ZuluString(),

            // Log level info
            'level' => strtolower($data['level_name'] ?? 'info'),
            'level_name' => $data['level_name'] ?? 'INFO',
            'level_code' => $data['level'] ?? 200,

            // Channel/source
            'channel' => $data['channel'] ?? 'app',

            // The actual log message
            'message' => $data['message'] ?? '',
        ];

        // Add context (custom data passed to the log)
        if (!empty($data['context'])) {
            $structured['context'] = $this->cleanContext($data['context']);
        }

        // Add extra data from processors (memory, introspection, etc.)
        if (!empty($data['extra'])) {
            $structured['extra'] = $data['extra'];
        }

        // Application metadata
        $structured['app'] = [
            'name' => $this->appName,
            'environment' => $this->environment,
            'version' => $this->version,
        ];

        // Add request ID if available in context
        if (isset($data['context']['request_id'])) {
            $structured['trace_id'] = $data['context']['request_id'];
        }

        // Add user info at top level for easier querying
        if (isset($data['context']['user'])) {
            $structured['user'] = $data['context']['user'];
            unset($structured['context']['user']);
        }

        // Add request info at top level
        if (isset($data['context']['request'])) {
            $structured['http'] = $data['context']['request'];
            unset($structured['context']['request']);
        }

        // Extract exception info for easier querying
        if (isset($data['context']['exception'])) {
            $structured['error'] = $data['context']['exception'];
            unset($structured['context']['exception']);
        }

        // Clean up empty context after extraction
        if (empty($structured['context'])) {
            unset($structured['context']);
        }

        return $structured;
    }

    /**
     * Clean and sanitize context data
     */
    protected function cleanContext(array $context): array
    {
        $cleaned = [];

        foreach ($context as $key => $value) {
            // Skip null values
            if ($value === null) {
                continue;
            }

            // Convert objects to arrays
            if (is_object($value)) {
                if (method_exists($value, 'toArray')) {
                    $value = $value->toArray();
                } elseif (method_exists($value, '__toString')) {
                    $value = (string) $value;
                } else {
                    $value = '[Object: ' . get_class($value) . ']';
                }
            }

            // Recursively clean arrays
            if (is_array($value)) {
                $value = $this->cleanContext($value);
                if (empty($value)) {
                    continue;
                }
            }

            // Truncate very long strings
            if (is_string($value) && strlen($value) > 10000) {
                $value = substr($value, 0, 10000) . '... [TRUNCATED]';
            }

            $cleaned[$key] = $value;
        }

        return $cleaned;
    }
}
