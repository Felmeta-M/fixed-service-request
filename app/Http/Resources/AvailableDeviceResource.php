<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AvailableDeviceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'vendor' => $this->vendor,
            'model' => $this->model,
            'device_type' => $this->device_type,
            'price' => (float) $this->price,
            'description' => $this->description,
            'status' => $this->status,
            'image_url' => $this->image_url,
            'stock_quantity' => $this->stock_quantity,
            'specifications' => $this->specifications ?? [],
        ];
    }
}
