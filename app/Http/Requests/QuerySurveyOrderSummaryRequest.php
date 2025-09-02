<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Carbon\Carbon;

class QuerySurveyOrderSummaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_time' => ['required', 'string'],
            'end_time'   => ['required', 'string'],
            'begin_row_num' => ['nullable', 'integer', 'min:0'],
            'fetch_row_num' => ['nullable', 'integer', 'min:1', 'max:500'],
        ];
    }

    /**
     * Preprocess: convert user-friendly dates to Huawei format
     */
    protected function prepareForValidation(): void
    {
        $normalizeDate = function ($date) {
            if (!$date) return null;
            return preg_replace('/[^\d]/', '', $date);
        };

        $start = \Carbon\Carbon::createFromFormat('YmdHis', preg_replace('/[^\d]/', '', $this->start_time));
        $end   = \Carbon\Carbon::createFromFormat('YmdHis', preg_replace('/[^\d]/', '', $this->end_time));

        // Swap if start > end
        if ($start->gt($end)) {
            [$start, $end] = [$end, $start];
        }

        // Limit period to 1 month
        if ($start->diffInDays($end) > 31) {
            $end = $start->copy()->addDays(31)->endOfDay();
        }

        $this->merge([
            'start_time' => $normalizeDate($start),
            'end_time'   => $normalizeDate($end),
            'begin_row_num' => $this->begin_row_num ?? 0,
            'fetch_row_num' => $this->fetch_row_num ?? 100,
        ]);
    }
}
