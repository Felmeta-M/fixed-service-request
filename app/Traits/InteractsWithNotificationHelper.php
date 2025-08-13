<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait InteractsWithNotificationHelper
{
    public static function getNotificationInsideDB(string $key, string $language, array $parameters = []): ?string
    {
        $notification = DB::table('notification_helpers')
            ->where('key', $key)
            ->where('language', $language)
            ->first();

        if ($notification) {
            return strtr($notification->message, $parameters);
        }

        return null;
    }

    public static function getNotificationInsideConfig(string $key, string $language, array $parameters = []): ?string
    {

        $notification = config('startup.' . $key);
        if ($notification) {
            return strtr($notification, $parameters);
        }

        return null;
    }

    // public function sendMessage()
    // {
    //     // Example usage
    //     $orderNumber = '12345';
    //     $address = '123 Main St';
    //     $link = 'https://example.com/reset-password';

    //     $message = InteractsWithNotificationHelper::getNotificationInsideDB('order_confirmation', 'en', [
    //         ':order_number' => $orderNumber,
    //         ':address' => $address,
    //     ]);

    //     return $message;
    // }
}
