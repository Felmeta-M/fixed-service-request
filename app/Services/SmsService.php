<?php

namespace App\Services;

use App\Traits\InteractsWithSMSGateway;

class SmsService
{
    use InteractsWithSMSGateway;

    public function send($to, $message)
    {
        if (self::ensurePhoneIsLocal($to)) {
            $this->sendSmsOnly($to,  $message);
        }
    }
}
