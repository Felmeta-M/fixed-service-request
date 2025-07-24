<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerCategory extends Model
{
    protected $fillable = ['customer_type_id', 'name', 'api_value'];

    public function type()
    {
        return $this->belongsTo(CustomerType::class, 'customer_type_id');
    }

    public function subcategories()
    {
        return $this->hasMany(CustomerSubcategory::class);
    }
}
