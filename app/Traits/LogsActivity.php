<?php

namespace App\Traits;

use App\Services\Logging\AppLogger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * Trait for logging model create/update/delete events.
 *
 * Usage: Add `use LogsActivity;` to your Eloquent model.
 *
 * Optionally define in your model:
 *   - protected array $logOnlyAttributes = ['status', 'amount']; // Only log these attributes
 *   - protected array $logExceptAttributes = ['updated_at'];     // Don't log these attributes
 *   - protected string $logName = 'payment';                     // Custom log channel
 */
trait LogsActivity
{
    /**
     * Boot the trait and register model event listeners
     */
    public static function bootLogsActivity(): void
    {
        static::created(function (Model $model) {
            static::logModelEvent($model, 'created');
        });

        static::updated(function (Model $model) {
            static::logModelEvent($model, 'updated');
        });

        static::deleted(function (Model $model) {
            static::logModelEvent($model, 'deleted');
        });
    }

    /**
     * Log a model event
     */
    protected static function logModelEvent(Model $model, string $event): void
    {
        $modelName = class_basename($model);
        $logChannel = $model->getActivityLogChannel();

        $context = [
            'model' => $modelName,
            'model_id' => $model->getKey(),
            'event' => $event,
            'table' => $model->getTable(),
        ];

        // Add user context
        try {
            $user = Auth::guard('otp')->user() ?? Auth::guard('api')->user() ?? Auth::user();
            if ($user) {
                $context['actor'] = [
                    'id' => $user->id ?? null,
                    'type' => class_basename($user),
                    'customer_code' => $user->customer_code ?? null,
                ];
            }
        } catch (\Throwable) {
            // Ignore auth errors
        }

        // Add changed attributes for updates
        if ($event === 'updated') {
            $changes = $model->getFilteredChanges();
            if (empty($changes)) {
                return; // Skip logging if no relevant changes
            }
            $context['changes'] = $changes;
        }

        // Add attributes for creation
        if ($event === 'created') {
            $context['attributes'] = $model->getFilteredAttributes();
        }

        // Add soft delete info
        if ($event === 'deleted' && method_exists($model, 'isForceDeleting')) {
            $context['force_deleted'] = $model->isForceDeleting();
        }

        // Log the event
        $message = sprintf('%s %s #%s', $modelName, $event, $model->getKey());

        $logger = match ($logChannel) {
            'payment' => AppLogger::payment(),
            'auth' => AppLogger::auth(),
            'security' => AppLogger::security(),
            default => AppLogger::business(),
        };

        $logger->info($message, $context);
    }

    /**
     * Get the log channel for this model
     */
    public function getActivityLogChannel(): string
    {
        return $this->logName ?? 'business';
    }

    /**
     * Get filtered changes (only the attributes we want to log)
     */
    public function getFilteredChanges(): array
    {
        $changes = $this->getChanges();
        $original = [];

        foreach ($changes as $key => $value) {
            if ($this->shouldLogAttribute($key)) {
                $original[$key] = $this->getOriginal($key);
            } else {
                unset($changes[$key]);
            }
        }

        if (empty($changes)) {
            return [];
        }

        // Mask sensitive data
        return [
            'old' => $this->maskSensitiveAttributes($original),
            'new' => $this->maskSensitiveAttributes($changes),
        ];
    }

    /**
     * Get filtered attributes for logging
     */
    public function getFilteredAttributes(): array
    {
        $attributes = [];

        foreach ($this->getAttributes() as $key => $value) {
            if ($this->shouldLogAttribute($key)) {
                $attributes[$key] = $value;
            }
        }

        return $this->maskSensitiveAttributes($attributes);
    }

    /**
     * Check if an attribute should be logged
     */
    protected function shouldLogAttribute(string $attribute): bool
    {
        // Skip timestamps by default
        $defaultExcluded = ['created_at', 'updated_at', 'deleted_at', 'remember_token'];

        // Check custom exclusions
        $excluded = array_merge(
            $defaultExcluded,
            $this->logExceptAttributes ?? []
        );

        if (in_array($attribute, $excluded, true)) {
            return false;
        }

        // If specific attributes are defined, only log those
        if (isset($this->logOnlyAttributes) && !empty($this->logOnlyAttributes)) {
            return in_array($attribute, $this->logOnlyAttributes, true);
        }

        return true;
    }

    /**
     * Mask sensitive attributes
     */
    protected function maskSensitiveAttributes(array $attributes): array
    {
        $sensitiveKeys = [
            'password', 'secret', 'token', 'api_key', 'private_key',
            'otp', 'pin', 'verification_code', 'sub', 'picture',
        ];

        foreach ($attributes as $key => $value) {
            if (in_array(strtolower($key), $sensitiveKeys, true)) {
                $attributes[$key] = '***REDACTED***';
            }
        }

        return $attributes;
    }
}
