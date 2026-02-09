<?php

namespace App\Filament\Pages\Auth;

use App\Models\User;
use App\Traits\InteractsWithSMSGateway;
use DanHarrin\LivewireRateLimiting\Exceptions\TooManyRequestsException;
use Filament\Actions\Action;
use Filament\Auth\Pages\PasswordReset\RequestPasswordReset as BaseRequestPasswordReset;
use Filament\Facades\Filament;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Schemas\Components\Component;
use Filament\Schemas\Schema;
use Filament\Support\Facades\FilamentIcon;
use Filament\Support\Icons\Heroicon;
use Filament\View\PanelsIconAlias;
use Illuminate\Contracts\Support\Htmlable;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class RequestPasswordReset extends BaseRequestPasswordReset
{
    use InteractsWithSMSGateway;

    public function getTitle(): string | Htmlable
    {
        return __('Forgot your password?');
    }

    public function getHeading(): string | Htmlable
    {
        return __('Forgot your password?');
    }

    public function getSubheading(): string | Htmlable | null
    {
        return __('Enter your phone number to receive a verification code.');
    }

    /**
     * Override the base request method to use phone + OTP instead of email link.
     */
    public function request(): void
    {
        try {
            $this->rateLimit(5);
        } catch (TooManyRequestsException $exception) {
            $this->getRateLimitedNotification($exception)?->send();

            return;
        }

        $data = $this->form->getState();

        // Trim whitespace and normalize to last 9 digits — consistent with User model storage
        $phone = User::normalizePhone(trim($data['phone']));

        if (! $phone) {
            throw ValidationException::withMessages([
                'data.phone' => __('Please enter a valid phone number.'),
            ]);
        }

        // Look up user by normalized phone (last 9 digits)
        $user = User::withoutGlobalScopes()
            ->where('phone', $phone)
            ->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'data.phone' => __('No account found with this phone number.'),
            ]);
        }

        // Check if user account is active
        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'data.phone' => __('auth.account_deactivated'),
            ]);
        }

        try {
            // Send OTP via SMS (stores in service_clients table)
            self::sendOTP($phone);

            Notification::make()
                ->title(__('Verification code sent!'))
                ->body(__('Please check your phone for the verification code.'))
                ->success()
                ->send();

            $this->form->fill();

            // Redirect to the reset password page with user's email as identifier
            redirect()->to(
                Filament::getResetPasswordUrl(
                    token: 'otp', // placeholder token — actual verification uses OTP
                    user: $user,
                )
            );
        } catch (\RuntimeException $e) {
            // Rate limit from trait
            Notification::make()
                ->title(__('Too many attempts. Please try again later.'))
                ->danger()
                ->send();
        } catch (\Exception $e) {
            Log::error('Password reset OTP request failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            Notification::make()
                ->title(__('Failed to send verification code. Please try again.'))
                ->danger()
                ->send();
        }
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                $this->getPhoneFormComponent(),
            ]);
    }

    protected function getPhoneFormComponent(): Component
    {
        return TextInput::make('phone')
            ->label(__('Phone Number'))
            ->placeholder('09XXXXXXXX or 2519XXXXXXXX')
            ->trim()
            ->numeric()
            ->regex('/^(\+251|251|0)?(7|9)(\d){8}$/')
            ->required()
            ->autofocus();
    }

    protected function getFormActions(): array
    {
        return [
            $this->getRequestFormAction(),
        ];
    }

    protected function getRequestFormAction(): Action
    {
        return Action::make('request')
            ->label(__('Send verification code'))
            ->submit('request')
            ->extraAttributes(['class' => 'w-full']);
    }

    public function loginAction(): Action
    {
        return Action::make('login')
            ->link()
            ->label(__('filament-panels::auth/pages/password-reset/request-password-reset.actions.login.label'))
            ->icon(match (__('filament-panels::layout.direction')) {
                'rtl' => FilamentIcon::resolve(PanelsIconAlias::PAGES_PASSWORD_RESET_REQUEST_PASSWORD_RESET_ACTIONS_LOGIN_RTL) ?? Heroicon::ArrowRight,
                default => FilamentIcon::resolve(PanelsIconAlias::PAGES_PASSWORD_RESET_REQUEST_PASSWORD_RESET_ACTIONS_LOGIN) ?? Heroicon::ArrowLeft,
            })
            ->url(filament()->getLoginUrl());
    }
}
