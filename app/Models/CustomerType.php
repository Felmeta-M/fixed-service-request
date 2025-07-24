<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerType extends Model
{
    protected $fillable = ['name', 'api_value'];

    public function categories()
    {
        return $this->hasMany(CustomerCategory::class);
    }
}
