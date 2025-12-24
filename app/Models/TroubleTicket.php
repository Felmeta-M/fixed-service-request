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
    protected $guarded = [];

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

    public function scopeOpen($query)
    {
        return $query->whereIn('status', ['pending', 'in_progress']);
    }
}
