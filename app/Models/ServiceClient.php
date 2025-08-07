<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class ServiceClient extends Model
{
    use HasApiTokens;

    protected $fillable = ['name', 'code'];
}
