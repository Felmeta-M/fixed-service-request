<?php

namespace App\Models;

use App\Enums\FFDServiceProvisionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'payload' => 'array',
        'status'  => FFDServiceProvisionStatus::class,
    ];


    public function scopePending($query)
    {
        return $query->where('status', FFDServiceProvisionStatus::Pending->value);
    }

    public function scopePaid($query)
    {
        return $query->where('status', FFDServiceProvisionStatus::Paid->value);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', FFDServiceProvisionStatus::Failed->value);
    }

    public function scopeCanceled($query)
    {
        return $query->where('status', FFDServiceProvisionStatus::Cancelled->value);
    }

    public function survey_request()
    {
        return $this->belongsTo(SurveyRequest::class, 'customer_survey_order_id', 'customer_survey_order_id');
    }
}
