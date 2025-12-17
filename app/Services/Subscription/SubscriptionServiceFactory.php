<?php

namespace App\Services\Subscription;

use App\Enums\OfferId;
use InvalidArgumentException;

class SubscriptionServiceFactory
{
    public function make(int $mainOfferId): SubscriptionInterface
    {
        return match ($mainOfferId) {
            OfferId::FixedData->value  => app(DataSubscriptionService::class),
            OfferId::FixedVoice->value => app(VoiceSubscriptionService::class),
            OfferId::FixedCombo->value => app(ComboSubscriptionService::class),

            default => throw new InvalidArgumentException(
                "Unsupported subscription offer ID: {$mainOfferId}"
            ),
        };
    }
}
