<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QueryTTDetailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search_value' => 'required|string|max:50',
            'search_type' => 'sometimes|integer', // default 1
            'requestor' => 'sometimes|integer', // default 1
        ];
    }
}
