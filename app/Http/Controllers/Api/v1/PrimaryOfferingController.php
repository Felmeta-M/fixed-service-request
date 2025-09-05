<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\PrimaryOfferingService;
use Illuminate\Http\Request;

class PrimaryOfferingController extends Controller
{

    public function __construct(protected readonly PrimaryOfferingService $primaryOfferingService) {}

    public function getPrimaryOffer(Request $request)
    {
        $validated = $request->validate([
            'object_id' => 'required|string',
        ]);

        return $this->primaryOfferingService->queryAvailablePrimaryOffering($validated['object_id']);
    }
}
