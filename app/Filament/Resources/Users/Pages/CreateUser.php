<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
use App\Jobs\SendSmsJob;
use Filament\Facades\Filament;
use Filament\Resources\Pages\CreateRecord;
use Spatie\Permission\Models\Role;

class CreateUser extends CreateRecord
{
    protected static string $resource = UserResource::class;

    protected ?string $plainPassword = null;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        if (empty($data['password'])) {
            $this->plainPassword = str()->random(8);
            $data['password'] = $this->plainPassword;
        } else {
            $this->plainPassword = $data['password'];
        }

        // Default is_active to true for new users
        if (! isset($data['is_active'])) {
            $data['is_active'] = true;
        }

        return $data;
    }

    protected function afterCreate(): void
    {
        // If no roles were assigned, assign the default 'guest' role
        if ($this->record->roles()->count() === 0) {
            $guestRole = Role::where('name', 'guest')->where('guard_name', 'web')->first();
            if ($guestRole) {
                $this->record->assignRole($guestRole);
            }
        }

        // Send SMS with username (email) and password
        $phone = $this->record->phone;

        if ($phone && ! empty($this->plainPassword)) {
            $digits = preg_replace('/\D/', '', $phone);
            $lastNineDigits = strlen($digits) >= 9 ? substr($digits, -9) : $digits;

            if ($lastNineDigits) {
                $panel = Filament::getPanel('admin');
                $message = __('auth.user_created_sms', [
                    'name' => $this->record->name,
                    'email' => $this->record->email,
                    'password' => $this->plainPassword,
                    'url' => $panel ? $panel->getUrl() : url('/ffd'),
                ]);
                dispatch(new SendSmsJob($lastNineDigits, $message));
            }
        }
    }
}
