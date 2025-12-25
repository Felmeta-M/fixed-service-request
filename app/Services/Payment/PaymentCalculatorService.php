<?php

namespace App\Services\Payment;

use App\Enums\OfferId;
use App\Models\SurveyRequest;
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
     * @param SurveyRequest $survey
     * @param array|null $requestData Optional request data for third-party fee calculation
     * @return array ['subscription_fee', 'cable_charge', 'total_amount']
     */
    public function calculateFees(SurveyRequest $survey, ?array $requestData = null): array
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
     * Determine subscription / one-off fee.
     */
    protected function calculateSubscriptionFee(SurveyRequest $survey, ?array $requestData = null): int
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
     */
    protected function fetchVoiceComboFee(?array $requestData): int
    {
        if (empty($requestData['service_number'])) {
            return $this->defaultFee();
        }

        $response = $this->oneOffFeeService->calculateOneOffFee($requestData);
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
     */
    protected function calculateCableCharge(SurveyRequest $survey): float
    {
        return $this->cableChargeService->calculate($survey->cable_charge, $survey->cable_type);
    }
}
