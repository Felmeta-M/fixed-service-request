<?php

namespace App\Helpers;

use Illuminate\Support\Str;


class TelebirrHelper
{
    public static function createMerchantOrderId(): string
    {
        return now()->format('YmdHisv') . random_int(10, 99);
    }

    /**
     * Create a Unix timestamp as string.
     */
    public static function createTimeStamp(): string
    {
        return (string) time();
    }

    /**
     * Create a 32-character cryptographically secure random string.
     */
    public static function createNonceStr(): string
    {
        return Str::upper(Str::random(32)); // A-Z, 0-9
    }
}
