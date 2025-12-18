<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TroubleTicket extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'trouble_tickets';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'customer_code',
        'access_number',
        'contact_person',
        'mobile_no',
        'trouble_title',
        'trouble_reason',
        'tt_description',
        'tt_serial_no',
        'status',
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
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function scopeOpen($query)
    {
        return $query->whereIn('status', ['pending', 'in_progress']);
    }
}
