<?php

namespace App\Helpers;

/**
 * Helper class for bandwidth formatting.
 * 
 * Backend is the single source of truth for bandwidth display.
 * Frontend should display the value as-is without parsing.
 */
class BandwidthHelper
{
    /**
     * Format bandwidth for display.
     * 
     * Database stores bandwidth in KB (e.g., 10240 for 10 Mbps).
     * This function converts KB to human-readable Mbps/Gbps.
     * 
     * Examples:
     *   - "10M" or "10m" → "10 Mbps" (legacy string format)
     *   - 10240 → "10 Mbps" (KB format: 10240 KB = 10 MB)
     *   - 1048576 → "1 Gbps" (KB format: 1048576 KB = 1 GB)
     *   - null → null
     *
     * @param string|int|null $bandwidth Bandwidth value from database
     * @return string|null Formatted bandwidth for display (e.g., "10 Mbps", "1 Gbps")
     */
    public static function format(string|int|null $bandwidth): ?string
    {
        if ($bandwidth === null || $bandwidth === '') {
            return null;
        }

        $bwStr = trim((string) $bandwidth);

        // Handle legacy string format: "10M" or "10m" (already in Mbps)
        if (preg_match('/^(\d+)[Mm]$/', $bwStr, $matches)) {
            $mbps = (int) $matches[1];
            if ($mbps >= 1000) {
                $gbps = $mbps / 1000;
                return ($gbps == (int) $gbps ? (int) $gbps : number_format($gbps, 1)) . ' Gbps';
            }
            return $mbps . ' Mbps';
        }

        // Handle numeric value (stored in KB)
        if (is_numeric($bwStr)) {
            $numericValue = (int) $bwStr;
            
            // Sanity check: max reasonable bandwidth is 100 Gbps = 104,857,600 KB
            // If value is larger, it's likely invalid data - return raw value
            $maxReasonableKb = 104857600; // 100 Gbps in KB
            if ($numericValue > $maxReasonableKb) {
                return $bwStr; // Return raw value for debugging
            }

            // Convert KB to Mbps (divide by 1024)
            $mbps = $numericValue / 1024;

            // If result is >= 1000 Mbps, show as Gbps
            if ($mbps >= 1000) {
                $gbps = $mbps / 1000;
                return ($gbps == (int) $gbps ? (int) $gbps : number_format($gbps, 1)) . ' Gbps';
            }

            // Show as Mbps (integer if whole number, otherwise 1 decimal)
            return ($mbps == (int) $mbps ? (int) $mbps : number_format($mbps, 1)) . ' Mbps';
        }

        // Return as-is if we can't parse it
        return $bwStr;
    }

    /**
     * Get raw bandwidth value in KB for API/storage.
     * This returns the raw database value without formatting.
     *
     * @param string|int|null $bandwidth
     * @return int|null
     */
    public static function toKb(string|int|null $bandwidth): ?int
    {
        if ($bandwidth === null || $bandwidth === '') {
            return null;
        }

        return (int) $bandwidth;
    }
}
