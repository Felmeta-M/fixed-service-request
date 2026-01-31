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

        // Service owner info (from queried service number)
        'service_owner_code',
        'service_owner_name',
        'service_owner_type',
        'service_owner_level',

        // Service location/address for TT detail display
        'region',
        'zone',
        'city',
        'sub_city',
        'wereda',
        'kebele',
        'house_no',

        // TT details
        'contact_person',
        'mobile_no',
        'trouble_title',
        'trouble_reason',
        'tt_description',
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
        'status' => 'open',
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
        return $query->whereIn('status', ['open', 'confirm']);
    }

    public function scopeForCustomer($query, string $customerCode)
    {
        return $query->where('customer_code', $customerCode);
    }
}
