<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerSubcategory extends Model
{
    protected $fillable = ['customer_category_id', 'name', 'api_value'];

    public function category()
    {
        return $this->belongsTo(CustomerCategory::class, 'customer_category_id');
    }
}
