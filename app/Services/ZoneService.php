<?php

namespace App\Services;

use App\Models\EthioZone;
use App\Models\SurveyOrder;
use App\Models\TelecomRegion;
use App\Models\Zone;

/**
 * ZoneService - Zone resolution for subscription XML payloads.
 */
class ZoneService
{
    /**
     * Get zone code for CustomerAddressInfo XML.
     * Priority: survey_order.zone_code → area lookup → customer zone fallback
     * 2. survey_order.area_code → telecom_regions → ethio_zones
     * 3. Final fallback: $data['zone'] (customer zone) → zones table → zone_code
     */
    public function getZoneCodeForCustomerAddress(?array $data = null): ?string
    {
        $surveyOrderId = $data['survey_order_id'] ?? null;
        
        if ($surveyOrderId) {
            $surveyOrder = SurveyOrder::where('customer_survey_order_id', $surveyOrderId)->first();
            
            if ($surveyOrder) {
                if ($surveyOrder->zone_code) {
                    return $surveyOrder->zone_code;
                }
                
                $zoneCode = $this->getZoneCodeFromAreaCode($surveyOrder->area_code, $surveyOrder->area_name);
                if ($zoneCode) {
                    return $zoneCode;
                }
            }
        }
        
        $customerZoneId = $data['zone'] ?? $data['address']['zone'] ?? null;
        if ($customerZoneId) {
            return $this->getZoneCodeById($customerZoneId);
        }
        
        return null;
    }

    /**
     * Get zone code for AccountInfo XML.
     * Priority: survey_order.zone_code → area lookup → customer zone fallback
     */
    public function getZoneCodeForAccountInfo(string $surveyOrderId, ?array $data = null): ?string
    {
        $surveyOrder = SurveyOrder::where('customer_survey_order_id', $surveyOrderId)->first();

        if ($surveyOrder) {
            if ($surveyOrder->zone_code) {
                return $surveyOrder->zone_code;
            }

            $zoneCode = $this->getZoneCodeFromAreaCode($surveyOrder->area_code, $surveyOrder->area_name);
            if ($zoneCode) {
                return $zoneCode;
            }
        }

        $customerZoneId = $data['zone'] ?? $data['address']['zone'] ?? null;
        if ($customerZoneId) {
            return $this->getZoneCodeById($customerZoneId);
        }

        return null;
    }

    /**
     * Get zone name for AccountInfo (e.g. EAAZ, NAAZ) from telecom region.
     * Used to look up department ID from number_pools by zone name.
     */
    public function getZoneNameForAccountInfo(string $surveyOrderId, ?array $data = null): ?string
    {
        $zoneCode = $this->getZoneCodeForAccountInfo($surveyOrderId, $data);

        if (!$zoneCode) {
            return null;
        }

        return EthioZone::where('code', $zoneCode)->where('status', true)->value('name');
    }

    /**
     * Get zone code by zone ID.
     * Used by external consumers (CustomerService, Survey\Manual\* manual survey services, etc.)
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

    /**
     * Get EthioZone by customer-selected zone ID.
     *
     * Path: zone_id → zones.zone_code → ethio_zones (by code)
     *
     * Note: zones.zone_code stores the EthioZone CODE (e.g., "40"), not name (e.g., "SWAAZ")
     *
     * Used for:
     * - Customer creation (get EthioZone for customer profile)
     * - Manual survey creation (show nearest Ethio Telecom zones)
     */
    public function getEthioZoneByZoneId(int|string|null $zoneId): ?EthioZone
    {
        $zoneCode = $this->getZoneCodeById($zoneId);

        return $zoneCode ? $this->getEthioZoneByCode($zoneCode) : null;
    }

    /**
     * Get EthioZone by code (BSS code like "40", "21", "3").
     */
    public function getEthioZoneByCode(string $code): ?EthioZone
    {
        return EthioZone::where('code', $code)->where('status', true)->first();
    }

    /**
     * Get EthioZones for customer selection dropdown.
     *
     * Path: zone_id → zones.zone_code (=BSS code) → matching ethio_zones
     *
     * Returns: Array formatted for dropdown [{ value, label }, ...]
     * - label: name for display (e.g., "CAAZ", "NAAZ")
     * - value: BSS code for submission (e.g., "21", "22")
     *
     * Used for: Manual survey creation - customer selects nearest Ethio Telecom zone
     */
    public function getEthioZonesForSelection(int|string|null $zoneId): array
    {
        $zoneCode = $this->getZoneCodeById($zoneId);

        if (!$zoneCode) {
            return [];
        }

        // Get matching EthioZone by code (zones.zone_code stores BSS code)
        $matchingZone = $this->getEthioZoneByCode($zoneCode);

        if (!$matchingZone) {
            return [];
        }

        // Return formatted for dropdown: value = BSS code, label = name
        return [
            [
                'value' => $matchingZone->code,  // BSS code (e.g., "21")
                'label' => $matchingZone->name,  // Display name (e.g., "CAAZ")
                'id' => $matchingZone->id,       // DB id (for reference)
            ],
        ];
    }

    /**
     * Get EthioZone code from area_name or area_code.
     * Priority: area_name → telecom_regions, then area_code → telecom_regions
     */
    public function getZoneCodeFromAreaCode(?string $areaCode, ?string $areaName = null): ?string
    {
        if ($areaName) {
            $ethioZone = $this->findEthioZoneByAreaName($areaName);
            if ($ethioZone) {
                return $ethioZone->code;
            }
        }

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

    /**
     * Find EthioZone by area name from resource response.
     * Looks up telecom_regions table to find the zone.
     *
     * Priority:
     * 1. Exact match on telecom_regions.area_name
     * 2. Partial match on telecom_regions.area_name
     * 3. Direct match on ethio_zones.name
     */
    private function findEthioZoneByAreaName(string $areaName): ?EthioZone
    {
        $areaName = trim($areaName);
        
        if (empty($areaName)) {
            return null;
        }

        // Priority 1: Exact match on telecom_regions.area_name
        $telecomRegion = TelecomRegion::whereRaw('UPPER(area_name) = ?', [strtoupper($areaName)])
            ->where('status', true)
            ->first();
        
        if ($telecomRegion?->zone) {
            $ethioZone = $this->findEthioZoneByZoneName($telecomRegion->zone);
            if ($ethioZone) {
                return $ethioZone;
            }
        }

        // Priority 2: Partial match on telecom_regions.area_name
        $telecomRegion = TelecomRegion::whereRaw('UPPER(area_name) LIKE ?', ['%' . strtoupper($areaName) . '%'])
            ->where('status', true)
            ->first();
        
        if ($telecomRegion?->zone) {
            $ethioZone = $this->findEthioZoneByZoneName($telecomRegion->zone);
            if ($ethioZone) {
                return $ethioZone;
            }
        }

        // Priority 3: Direct match on ethio_zones.name (in case area_name is already a zone name)
        return $this->findEthioZoneByZoneName($areaName);
    }

    /**
     * Get all active EthioZones for selection dropdown.
     *
     * Returns: Array formatted for dropdown [{ value, label }, ...]
     * - label: name for display (e.g., "CAAZ", "NAAZ")
     * - value: BSS code for submission (e.g., "21", "22")
     *
     * Used for: When customer needs to select from all available Ethio Telecom zones
     */
    public function getAllEthioZonesForSelection(): array
    {
        return EthioZone::where('status', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn($zone) => [
                'value' => $zone->code,  // BSS code (e.g., "21")
                'label' => $zone->name,  // Display name (e.g., "CAAZ")
                'id' => $zone->id,       // DB id (for reference)
            ])
            ->toArray();
    }

    // =========================================================================
    // LOOKUP FUNCTIONS - Database operations
    // =========================================================================

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

}
