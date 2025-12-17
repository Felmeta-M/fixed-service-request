<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QueryTTRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'access_number' => 'required|string|max:50',
            'requestor' => 'sometimes|integer', // fallback default is 1
        ];
    }
}
