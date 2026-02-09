<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
use App\Jobs\SendSmsJob;
use Filament\Resources\Pages\CreateRecord;

class CreateUser extends CreateRecord
{
    protected static string $resource = UserResource::class;

    /**
     * Store the generated plain password before it gets hashed
     */
    protected ?string $plainPassword = null;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        // Generate a random password if not provided
        if (empty($data['password'])) {
            // Generate a simple 8-character password (numbers and lowercase letters)
            $this->plainPassword = str()->random(8);
            $data['password'] = $this->plainPassword;
        } else {
            // Store the provided password before creation (before it gets hashed)
            $this->plainPassword = $data['password'];
        }
        
        return $data;
    }

    protected function afterCreate(): void
    {
        $data = $this->form->getState();
        $roles = $data['roles'] ?? [];
        $this->record->roles()->sync($roles);

        // Use the stored plain password (captured before hashing)
        $plainPassword = $this->plainPassword;
        
        // Get phone and extract last 9 digits for SMS
        $phone = $this->record->phone;
        if ($phone && !empty($plainPassword)) {
            // Extract last 9 digits from phone number
            $digits = preg_replace('/\D/', '', $phone);
            $lastNineDigits = strlen($digits) >= 9 ? substr($digits, -9) : $digits;
            
            if ($lastNineDigits) {
                $message = __('auth.user_created_sms', [
                    'password' => $plainPassword, // Send simple/plain password
                    'url' => filament()->getPanel()->getUrl(),
                ]);
                // Send SMS to the last 9 digits of the phone number
                dispatch(new SendSmsJob($lastNineDigits, $message));
            }
        }
    }
}
