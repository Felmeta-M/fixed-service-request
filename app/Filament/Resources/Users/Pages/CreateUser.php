<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
use App\Jobs\SendSmsJob;
use Filament\Resources\Pages\CreateRecord;

class CreateUser extends CreateRecord
{
    protected static string $resource = UserResource::class;

    protected function afterCreate(): void
    {
        $data = $this->form->getState();
        $roles = $data['roles'] ?? [];
        $this->record->roles()->sync($roles);

        $phone = $this->record->phone;
        if ($phone && ! empty($data['password'] ?? null)) {
            $message = __('auth.user_created_sms', [
                'password' => $data['password'],
                'url' => filament()->getPanel()->getUrl(),
            ]);
            dispatch(new SendSmsJob($phone, $message));
        }
    }
}
