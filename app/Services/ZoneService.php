<?php

namespace App\Services;

use App\Models\EthioZone;
use App\Models\SurveyOrder;
use App\Models\TelecomRegion;
use App\Models\Zone;
use App\Support\CustomerContext;

/**
 * ZoneService - Single source of truth for all zone operations.
 *
 * Public API (consistent naming):
 * 1. getZoneCodeForCustomerAddress() → For <com:CustomerAddressInfo> XML
 * 2. getZoneCodeForAccountInfo()     → For <com:AccountInfo> XML
 *
 * Both return zone code, but resolve it differently based on context.
 * All functions return value or null - consuming classes decide to throw.
 */
class ZoneService
{
    // =========================================================================
    // PUBLIC API - Consistent naming, different resolution paths
    // =========================================================================

    /**
     * Get zone code for <com:CustomerAddressInfo> XML.
     *
     * Purpose: Customer's registered location (where customer is from).
     * Returns: Zone code (e.g., "CAAZ", "NAAZ", "EAAZ")
     *
     * Priority: customer context → passed data
     */
    public function getZoneCodeForCustomerAddress(?array $data = null): ?string
    {
        return $this->fromCustomerContext()
            ?? $this->fromData($data);
    }

    /**
     * Get zone code for <com:AccountInfo> XML.
     *
     * Purpose: Service origin location (where service originates from).
     * Returns: EthioZone ID (e.g., "21", "22") - the BSS zone identifier
     *
     * Priority: survey_order.zone_code → customer context → passed data → area_code
     */
    public function getZoneCodeForAccountInfo(string $surveyOrderId, ?array $data = null): ?string
    {
        $surveyOrder = SurveyOrder::where('customer_survey_order_id', $surveyOrderId)->first();

        $zoneCode = $this->resolveAccountInfoZoneCode($surveyOrder, $data);

        if (!$zoneCode) {
            return null;
        }

        return $this->toEthioZoneId($zoneCode);
    }

    /**
     * Get zone code by zone ID.
     * Used by external consumers (CustomerService, ManualSurveyOrderService, etc.)
     */
    public function getZoneCodeById(int|string|null $zoneId): ?string
    {
        if (!$zoneId) {
            return null;
        }

        return Zone::find($zoneId)?->zone_code;
    }

    /**
     * Get EthioZone by name.
     * Used by SurveyOrderController for manual survey zone lookup.
     */
    public function getEthioZoneByName(string $name): ?EthioZone
    {
        return EthioZone::where('name', $name)->where('status', true)->first();
    }

    // =========================================================================
    // ACCOUNT INFO RESOLUTION - Priority chain
    // =========================================================================

    /**
     * Resolve zone code for AccountInfo with priority chain.
     */
    private function resolveAccountInfoZoneCode(?SurveyOrder $surveyOrder, ?array $data): ?string
    {
        // Priority 1: Survey order zone_code (service origin from BSS)
        if ($code = $this->fromSurveyOrder($surveyOrder)) {
            return $code;
        }

        // Priority 2: Customer context (logged-in customer's zone)
        if ($code = $this->fromCustomerContextToEthioZoneCode()) {
            return $code;
        }

        // Priority 3: Passed data (webhooks/new customer)
        if ($code = $this->fromDataToEthioZoneCode($data)) {
            return $code;
        }

        // Priority 4: Area code fallback (legacy telecom region)
        return $this->fromAreaCode($surveyOrder?->area_code);
    }

    // =========================================================================
    // SOURCE FUNCTIONS - Individual zone sources
    // =========================================================================

    /**
     * From survey order record.
     */
    private function fromSurveyOrder(?SurveyOrder $surveyOrder): ?string
    {
        return $surveyOrder?->zone_code;
    }

    /**
     * From customer context → zone_code.
     * Path: customer.zone → zones.zone_code
     */
    private function fromCustomerContext(): ?string
    {
        return $this->getZoneCodeById(CustomerContext::zone());
    }

    /**
     * From customer context → EthioZone code.
     * Path: customer.zone → zones.zone_code → ethio_zones.code
     */
    private function fromCustomerContextToEthioZoneCode(): ?string
    {
        $zoneName = $this->fromCustomerContext();

        return $zoneName ? $this->getEthioZoneByName($zoneName)?->code : null;
    }

    /**
     * From data array → zone_code.
     * Path: data.zone → zones.zone_code
     */
    private function fromData(?array $data): ?string
    {
        $zoneId = $this->extractZoneId($data);

        return $zoneId ? $this->getZoneCodeById($zoneId) : null;
    }

    /**
     * From data array → EthioZone code.
     * Path: data.zone → zones.zone_code → ethio_zones.code
     */
    private function fromDataToEthioZoneCode(?array $data): ?string
    {
        $zoneName = $this->fromData($data);

        return $zoneName ? $this->getEthioZoneByName($zoneName)?->code : null;
    }

    /**
     * From area_code → EthioZone code (legacy fallback).
     * Path: area_code → telecom_regions.zone → ethio_zones.code
     */
    private function fromAreaCode(?string $areaCode): ?string
    {
        if (!$areaCode) {
            return null;
        }

        $telecomRegion = TelecomRegion::where('area_id', $areaCode)
            ->where('status', true)
            ->first();

        if (!$telecomRegion?->zone) {
            return null;
        }

        return $this->findEthioZoneByZoneName($telecomRegion->zone)?->code;
    }

    // =========================================================================
    // LOOKUP FUNCTIONS - Database operations
    // =========================================================================

    /**
     * Convert zone code/name to EthioZone ID.
     */
    private function toEthioZoneId(string $zoneCode): ?string
    {
        $ethioZone = EthioZone::where('code', $zoneCode)->where('status', true)->first()
            ?? EthioZone::where('name', $zoneCode)->where('status', true)->first();

        return $ethioZone ? (string) $ethioZone->id : null;
    }

    /**
     * Find EthioZone by zone name with suffix handling.
     * Handles: "NAAZ-2" → "NAAZ"
     */
    private function findEthioZoneByZoneName(string $zoneName): ?EthioZone
    {
        $zoneName = trim($zoneName);

        // Exact match (case-insensitive)
        $ethioZone = EthioZone::whereRaw('UPPER(name) = ?', [strtoupper($zoneName)])->first();

        if ($ethioZone) {
            return $ethioZone;
        }

        // Try base name without suffix
        $baseName = preg_replace('/[-_]\d+$/', '', $zoneName);

        if ($baseName === $zoneName) {
            return null;
        }

        return EthioZone::whereRaw('UPPER(name) = ?', [strtoupper($baseName)])->first()
            ?? EthioZone::whereRaw('UPPER(name) LIKE ?', [strtoupper($baseName) . '%'])
                ->orderByRaw('LENGTH(name) ASC')
                ->first();
    }

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================

    /**
     * Extract zone ID from data array.
     */
    private function extractZoneId(?array $data): int|string|null
    {
        if (!$data) {
            return null;
        }

        return $data['zone'] ?? $data['address']['zone'] ?? null;
    }
}
