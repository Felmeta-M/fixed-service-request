<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class ServiceClient extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = ['name', 'code'];
}
