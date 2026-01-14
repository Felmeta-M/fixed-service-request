<?php

namespace App\Services\Logging;

use Illuminate\Log\Logger;
use Monolog\Processor\IntrospectionProcessor;
use Monolog\Processor\MemoryUsageProcessor;
use Monolog\Processor\WebProcessor;

/**
 * Tap class to configure JSON formatted logging channels.
 *
 * This class is used by the logging config to apply the JSON formatter
 * and additional processors to specific log channels.
 *
 * Usage in config/logging.php:
 *   'json' => [
 *       'driver' => 'daily',
 *       'path' => storage_path('logs/json/app.log'),
 *       'tap' => [App\Services\Logging\JsonLogTap::class],
 *   ],
 */
class JsonLogTap
{
    /**
     * Customize the given logger instance.
     */
    public function __invoke(Logger $logger): void
    {
        foreach ($logger->getHandlers() as $handler) {
            // Apply JSON formatter
            $handler->setFormatter(new JsonLogFormatter());

            // Add useful processors
            $handler->pushProcessor(new MemoryUsageProcessor());

            // Add introspection (file, line, class, function)
            // Skip vendor files for cleaner logs
            $handler->pushProcessor(new IntrospectionProcessor(
                skipClassesPartials: ['Illuminate\\', 'Monolog\\'],
                skipStackFramesCount: 0
            ));
        }
    }
}
