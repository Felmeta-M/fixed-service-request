<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\FFDServiceProvisionStatus;
use App\Http\Controllers\Controller;
use App\Services\ApiResponse;
use Illuminate\Http\JsonResponse;

class StatusController extends Controller
{
    /**
     * Get all service provision status definitions.
     * Returns status values, labels, and metadata for frontend use.
     * This ensures frontend always uses the latest status labels from backend.
     *
     * @return JsonResponse
     */
    public function definitions(): JsonResponse
    {
        $statuses = [];
        $businessLabels = [];

        foreach (FFDServiceProvisionStatus::cases() as $status) {
            $statuses[] = [
                'value' => $status->value,
                'label' => $status->label(),
                'name' => $status->name,
            ];

            // Include all possible business labels for each status
            // This helps frontend know all possible label variations
            $businessLabels[$status->value] = $status->possibleBusinessLabels();
        }

        return ApiResponse::success([
            'statuses' => $statuses,
            // Provide a map for quick lookup by value
            'status_map' => array_column($statuses, 'label', 'value'),
            // Provide a map for quick lookup by label
            'label_map' => array_column($statuses, 'value', 'label'),
            // Business-specific labels that may vary based on context
            'business_labels' => $businessLabels,
        ]);
    }
}
