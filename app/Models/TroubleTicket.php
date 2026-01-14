<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class TroubleTicket extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'trouble_tickets';

    /**
     * The attributes that are mass assignable.
     * Only allow specific fields to prevent mass assignment attacks.
     */
    protected $fillable = [
        'customer_code',
        'access_number',
        'service_number',
        'tt_serial_no',
        'status',
        'problem_type',
        'problem_description',
        'last_checked_at',
        'last_synced_status',
    ];

    /**
     * Attributes that should never be mass assigned.
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Default attribute values.
     */
    protected $attributes = [
        'status' => 'pending',
    ];

    /**
     * Attribute casting.
     */
    protected $casts = [
        'last_checked_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Hidden attributes (not exposed in arrays/JSON)
     */
    protected $hidden = [
        'deleted_at',
    ];

    public function scopeOpen($query)
    {
        return $query->whereIn('status', ['pending', 'in_progress']);
    }

    public function scopeForCustomer($query, string $customerCode)
    {
        return $query->where('customer_code', $customerCode);
    }
}
