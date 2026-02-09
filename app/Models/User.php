<?php

namespace App\Models;


use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;


class User extends Authenticatable implements FilamentUser
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;
    use HasRoles;

    /**
     * The attributes that are mass assignable.
     * Only allow specific fields to prevent mass assignment attacks.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'is_active',
        'zones',
        'areas',
    ];

    /**
     * Attributes that should never be mass assigned.
     *
     * @var list<string>
     */
    protected $guarded = [
        'id',
        'email_verified_at',
        'remember_token',
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'zones' => 'array',
            'areas' => 'array',
        ];
    }

    /**
     * Normalize phone for storage and login: trim, digits only, last 9 digits, prefix 251.
     * e.g. " 0912345678 ", "251912345678", "912345678" → 251912345678
     */
    public static function normalizePhone(?string $value): ?string
    {
        if (blank($value)) {
            return null;
        }
        $digits = preg_replace('/\D/', '', trim($value));
        if ($digits === '') {
            return null;
        }
        $lastNine = strlen($digits) >= 9 ? substr($digits, -9) : $digits;
        return $lastNine;
    }

    public function setPhoneAttribute(?string $value): void
    {
        $this->attributes['phone'] = self::normalizePhone($value);
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return $this->is_active;
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($user) {
            // Automatically set email_verified_at when creating a new user
            if (empty($user->email_verified_at)) {
                $user->email_verified_at = now();
            }
        });
    }
}
