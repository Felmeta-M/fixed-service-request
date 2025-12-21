<?php

use Illuminate\Http\Resources\Json\JsonResource;

class ResourceResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'distance' => (string)$this->DISTANCE,
            'ava_port' => (string)$this->AVAPORT,
            'neid' => (string)$this->NEID,
            'nename' => (string)$this->NENAME,
            'typeid' => (string)$this->TYPEID,
            'longitude' => (string)$this->longitude,
            'latitude' => (string)$this->latitude,
            'cable_type' => (string)$this->CABLETYPE,
            'cable_type_desc' => (string)$this->CABLETYPEDESC,
        ];
    }
}
