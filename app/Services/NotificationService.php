<?php

namespace App\Services;

use App\Traits\InteractsWithSMSGateway;

class NotificationService
{
    use InteractsWithSMSGateway;

    /**
     * Send survey created/completed notification.
     *
     * Triggered when manual survey completes during sync with third-party API.
     */
    public static function sendSurveyCreated(
        string $phone,
        string $customerName,
        string $serviceType,
        string $orderNumber
    ): void {
        $message = self::buildMessage('survey_created', [
            'customer_name' => $customerName,
            'service_type' => self::getServiceTypeLabel($serviceType),
            'order_number' => $orderNumber,
        ]);

        self::sendSmsOnly($phone, $message);
    }

    /**
     * Send survey failed notification.
     *
     * Triggered when manual survey fails during sync with third-party API.
     */
    public static function sendSurveyFailed(
        string $phone,
        string $customerName,
        string $serviceType,
        string $orderNumber,
        ?string $failureReason = null
    ): void {
        $reasonText = $failureReason
            ? "Reason: {$failureReason}"
            : 'Please contact support for more details.';

        $message = self::buildMessage('survey_failed', [
            'customer_name' => $customerName,
            'service_type' => self::getServiceTypeLabel($serviceType),
            'order_number' => $orderNumber,
            'failure_reason' => $reasonText,
        ]);

        self::sendSmsOnly($phone, $message);
    }

    /**
     * Send subscription activated notification.
     *
     * Triggered when subscription is successfully activated (auto process).
     */
    public static function sendSubscriptionActivated(
        string $phone,
        string $serviceType,
        string $serviceNumber
    ): void {
        $message = self::buildMessage('subscription_activated', [
            'service_type' => self::getServiceTypeLabel($serviceType),
            'service_number' => $serviceNumber,
        ]);

        self::sendSmsOnly($phone, $message);
    }

    /**
     * Send internet credentials notification.
     *
     * Sent after Data or Combo subscription activation.
     */
    public static function sendInternetCredentials(
        string $phone,
        string $serviceNumber,
        string $username,
        string $password
    ): void {
        $message = self::buildMessage('internet_credentials', [
            'service_number' => $serviceNumber,
            'username' => $username,
            'password' => $password,
        ]);

        self::sendSmsOnly($phone, $message);
    }

    /**
     * Build message from template with placeholder replacement.
     */
    protected static function buildMessage(string $template, array $placeholders): string
    {
        $message = config("notifications.templates.{$template}");

        if (! $message) {
            throw new \InvalidArgumentException("Notification template '{$template}' not found.");
        }

        foreach ($placeholders as $key => $value) {
            $message = str_replace("{{$key}}", $value, $message);
        }

        return $message;
    }

    /**
     * Get human-readable service type label.
     */
    protected static function getServiceTypeLabel(string $serviceType): string
    {
        $serviceType = strtolower($serviceType);

        return config("notifications.service_types.{$serviceType}", ucfirst($serviceType));
    }
}
