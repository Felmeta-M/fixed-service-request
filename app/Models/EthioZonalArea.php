<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EthioZonalArea extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     * Only allow specific fields to prevent mass assignment attacks.
     */
    protected $fillable = [
        'area_code',
        'area_name',
        'description',
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
}
