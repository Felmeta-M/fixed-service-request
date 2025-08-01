<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Zone extends Model
{
    use HasFactory;
    use SoftDeletes;

    public function region()
    {
        return $this->belongsTo(Region::class);
    }

    public function weredas()
    {
        return $this->hasMany(Wereda::class);
    }
}
