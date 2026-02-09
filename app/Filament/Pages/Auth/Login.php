<?php

namespace App\Filament\Pages\Auth;

use App\Models\User;
use Filament\Facades\Filament;
use Filament\Forms\Components\TextInput;
use Filament\Auth\Http\Responses\Contracts\LoginResponse;
use Filament\Models\Contracts\FilamentUser;
use Filament\Schemas\Components\Component;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use SensitiveParameter;

/**
 * Admin panel login with email or phone + password. Single "username" field
 * accepts either email or phone number (normalized: trim, last 9 digits, 251 prefix).
 */
class Login extends \Filament\Auth\Pages\Login
{
    private const RATE_LIMIT_KEY = 'filament-admin-login';

    private const RATE_LIMIT_MAX_ATTEMPTS = 5;

    private const RATE_LIMIT_DECAY_SECONDS = 60;

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                $this->getUsernameFormComponent(),
                $this->getPasswordFormComponent(),
                $this->getRememberFormComponent(),
            ]);
    }

    protected function getUsernameFormComponent(): Component
    {
        return TextInput::make('username')
            ->label(__('auth.email_or_phone'))
            ->placeholder(__('auth.email_or_phone_placeholder'))
            ->required()
            ->autocomplete('username')
            ->autofocus();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function getCredentialsFromFormData(#[SensitiveParameter] array $data): array
    {
        $input = trim((string) ($data['username'] ?? ''));
        $password = $data['password'] ?? '';

        if (filter_var($input, FILTER_VALIDATE_EMAIL)) {
            return [
                'email' => strtolower($input),
                'password' => $password,
            ];
        }
        if (strlen($input) >= 9 && is_numeric(substr($input, -9))) {
            return [
                'phone' => User::normalizePhone($input),
                'password' => $password,
            ];
        }

        return [
            'email' => $input,
            'password' => $password,
        ];
    }

    protected function throwFailureValidationException(): never
    {
        throw ValidationException::withMessages([
            'data.username' => __('auth.failed'),
        ]);
    }

    public function authenticate(): ?LoginResponse
    {
        $throttleKey = self::RATE_LIMIT_KEY . ':' . request()->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, self::RATE_LIMIT_MAX_ATTEMPTS)) {
            throw ValidationException::withMessages([
                'data.username' => __('auth.throttle', [
                    'seconds' => RateLimiter::availableIn($throttleKey),
                ]),
            ]);
        }

        $this->validate();

        $data = $this->form->getState();
        $credentials = $this->getCredentialsFromFormData($data);

        $hasEmail = !empty($credentials['email']);
        $hasPhone = !empty($credentials['phone']);
        if (!$hasEmail && !$hasPhone) {
            throw ValidationException::withMessages([
                'data.username' => __('validation.required', ['attribute' => __('auth.email_or_phone')]),
            ]);
        }

        $guard = Filament::auth();
        $remember = (bool) ($data['remember'] ?? false);

        if (!$guard->attempt($credentials, $remember)) {
            RateLimiter::hit($throttleKey, self::RATE_LIMIT_DECAY_SECONDS);
            $this->throwFailureValidationException();
        }

        RateLimiter::clear($throttleKey);

        $user = $guard->user();

        // Check if the account is deactivated — show a specific message
        if ($user instanceof User && ! $user->is_active) {
            $guard->logout();

            throw ValidationException::withMessages([
                'data.username' => __('auth.account_deactivated'),
            ]);
        }

        if ($user instanceof FilamentUser && ! $user->canAccessPanel(Filament::getCurrentPanel())) {
            $guard->logout();
            $this->throwFailureValidationException();
        }

        session()->regenerate();

        return app(LoginResponse::class);
    }
}
