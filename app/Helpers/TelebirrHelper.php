<?php

namespace App\Helpers;

class TelebirrHelper
{
    public static function createMerchantOrderId(): string
    {
        return (string) floor(microtime(true) * 1000);
    }

    public static function createTimeStamp(): string
    {
        return (string) time();
    }

    public static function createNonceStr(): string
    {
        return bin2hex(random_bytes(16)); // 32 chars
    }
}
