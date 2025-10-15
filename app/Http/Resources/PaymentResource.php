<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'customer_code'   => $this->customer_code,
            'reference_number' => $this->reference_number,
            'amount'          => $this->amount,
            'status'          => $this->status->label(),
            // 'status_label'    => $this->status->label(),
            'payload'         => $this->payload,
            'created_at'      => $this->created_at,
            'updated_at'      => $this->updated_at,
        ];
    }
}
