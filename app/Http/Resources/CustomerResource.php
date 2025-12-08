<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray($request)
    {
        $nameParts = explode(' ', $this->name);
        return [
            'sub' => $this->sub,

            'first_name' => $nameParts[0] ?? '',
            'middle_name' => $nameParts[1] ?? '',
            'last_name' => $nameParts[2] ?? '',

            'title' => $this->title,
            'gender' => $this->gender,
            'nationality' => $this->nationality,

            'identification_type' => $this->identification_type,
            'identification_number' => $this->identification_number,
            'date_of_birth' => $this->birthdate?->format('Y-m-d'),
            'place_of_birth' => $this->place_of_birth,

            'phone' => $this->phone_number,
            'email' => $this->email,

            'occupation' => $this->occupation,
            'education' => $this->education,
            'religion' => $this->religion,
            'income' => $this->income,
            'primary_language' => $this->primary_language,

            'customer_type' => $this->customer_type,
            'customer_category' => $this->customer_category,
            'customer_subcategory' => $this->customer_subcategory,

            // Address
            'address' => $this->address
                ? json_decode($this->address, true)
                : [
                    'region' => '',
                    'zone' => '',
                    'woreda' => '',
                    'city' => '',
                    'street_name' => '',
                    'kebele' => '',
                    'house_no' => '',
                ],

            // Contact
            'contact' => $this->contact
                ? json_decode($this->contact, true)
                : [
                    'notification_mode' => '',
                    'mobile_no' => $this->phone_number,
                    'office_no' => '',
                    'email' => $this->email,
                    'home_no' => '',
                    'fax_no' => '',
                ],

            // Contact persons
            'contact_person' => is_array($this->contact_persons)
                ? $this->contact_persons
                : [],

            'photo_base64' => $this->picture,
        ];
    }
}
