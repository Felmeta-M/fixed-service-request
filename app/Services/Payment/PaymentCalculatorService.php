<?php

namespace App\Services\Payment;

use App\Enums\OfferId;
use App\Models\SurveyOrder;
use Illuminate\Support\Facades\Log;

class PaymentCalculatorService
{
    public function __construct(
        protected OneOffFeeService $oneOffFeeService,
        protected CableChargeService $cableChargeService
    ) {}

    /**
     * Calculate all fees for a survey request.
     *
     * @param SurveyOrder $survey
     * @param array|null $requestData Optional request data for third-party fee calculation
     * @return array ['subscription_fee', 'cable_charge', 'total_amount']
     */
    public function calculateFees(SurveyOrder $survey, ?array $requestData = null): array
    {
        $subscriptionFee = $this->calculateSubscriptionFee($survey, $requestData);
        $cableCharge     = $this->calculateCableCharge($survey);

        return [
            'subscription_fee' => $subscriptionFee,
            'cable_charge'     => $cableCharge,
            'total_amount'     => $subscriptionFee + $cableCharge,
        ];
    }

    /**
     * Calculate fees for manual survey requests (without cable charge).
     *
     * @param SurveyOrder $survey
     * @param array|null $requestData Optional request data for third-party fee calculation
     * @return array ['subscription_fee', 'cable_charge', 'total_amount']
     */
    public function calculateFeesWithoutCable(SurveyOrder $survey, ?array $requestData = null): array
    {
        $subscriptionFee = $this->calculateSubscriptionFee($survey, $requestData);

        return [
            'subscription_fee' => $subscriptionFee,
            'cable_charge'     => 0,
            'total_amount'     => $subscriptionFee,
        ];
    }

    /**
     * Determine subscription / one-off fee.
     */
    protected function calculateSubscriptionFee(SurveyOrder $survey, ?array $requestData = null): int
    {
        return match ((int) $survey->main_offer_id) {
            OfferId::FixedData->value => 0, // Data service → zero subscription
            OfferId::FixedVoice->value,
            OfferId::FixedCombo->value => $this->fetchVoiceComboFee($requestData),
            default => 0,
        };
    }

    /**
     * Call OneOffFeeService for Voice/Combo, fallback to default if fails.
     * Accepts service_number or voice_service_number (one-off fee is for voice line).
     */
    protected function fetchVoiceComboFee(?array $requestData): int
    {
        $serviceNumber = $requestData['service_number'] ?? $requestData['voice_service_number'] ?? null;
        if (empty($serviceNumber)) {
            return $this->defaultFee();
        }

        $payload = array_merge($requestData ?? [], ['service_number' => $serviceNumber]);
        $response = $this->oneOffFeeService->calculateOneOffFee($payload);
        $data = $response->getData(true);

        if (!($data['success'] ?? false)) {
            return $this->defaultFee();
        }

        return $this->computeTotalFee($data['data']['fees']);
    }

    /**
     * Compute total fee including discounts and taxes.
     */
    protected function computeTotalFee(array $fees): int
    {
        $total = 0;

        foreach ($fees as $fee) {
            $calculated = (int)($fee['calculated_fee'] ?? 0);
            $discount   = (int)($fee['discount_fee'] ?? 0);
            $taxAmount  = 0;

            foreach ($fee['taxes'] ?? [] as $tax) {
                $taxAmount += (int)($tax['fee'] ?? 0);
            }

            $total += ($calculated - $discount + $taxAmount);
        }

        return (int)($total / 10000);
    }


    /**
     * Default fee if third-party fails or for Data services.
     */
    protected function defaultFee(): int
    {
        return 0;
    }

    /**
     * Calculate cable charge.
     * Uses cable_length when present (e.g. manual survey BSS 2147), else cable_charge as length input.
     */
    protected function calculateCableCharge(SurveyOrder $survey): float
    {
        $length = $survey->cable_length ?? $survey->cable_charge;
        return $this->cableChargeService->calculate($length, $survey->cable_type);
    }
}
