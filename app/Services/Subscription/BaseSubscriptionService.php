<?php

namespace App\Services\Subscription;

use App\Services\BaseApiService;
use App\Services\Payment\PaymentService;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use Illuminate\Support\Str;

abstract class BaseSubscriptionService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;
    protected ?string $serviceNumber = null;

    public function __construct(
        protected readonly PaymentService $payment_service,
        protected readonly QueryAvailableNumberService $queryAvailableNumberService,
        protected readonly ReserveNumberService $reserveNumberService,
    ) {}

    protected function endpoint(): string
    {
        return config('services.subscriber.endpoint');
    }

    protected function transactionId(): string
    {
        return  uniqid();
    }

    protected function processTime(): string
    {
        return now()->format('YmdHis');
    }

    protected function generateEmail(): string
    {
        return strtolower(Str::random(8) . '@qq.com');
    }

    /** Service-specific constants */
    abstract protected function offeringId(): int;
    abstract protected function businessCode(): string;
    abstract protected function networkType(): int;
}
