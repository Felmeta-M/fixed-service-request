<?php

namespace App\Filament\Pages\Auth;

use App\Jobs\SendSmsJob;
use App\Models\User;
use App\Traits\InteractsWithSMSGateway;
use DanHarrin\LivewireRateLimiting\Exceptions\TooManyRequestsException;
use Filament\Actions\Action;
use Filament\Auth\Http\Responses\Contracts\PasswordResetResponse;
use Filament\Auth\Pages\PasswordReset\ResetPassword as BaseResetPassword;
use Filament\Facades\Filament;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Schemas\Components\Component;
use Filament\Schemas\Schema;
use Illuminate\Contracts\Support\Htmlable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password as PasswordRule;

class ResetPassword extends BaseResetPassword
{
    use InteractsWithSMSGateway;

    public ?string $otp = null;

    /**
     * Override mount to bypass Filament's default token/email validation.
     * Our flow uses OTP verification instead of URL tokens.
     */
    public function mount(?string $email = null, ?string $token = null): void
    {
        if (Filament::auth()->check()) {
            redirect()->intended(Filament::getUrl());

            return;
        }

        // Store email from URL so we can look up the user later
        $this->email = $email ?? request()->query('email');

        $this->form->fill([
            'email' => $this->email,
        ]);
    }

    public function getTitle(): string | Htmlable
    {
        return __('Reset Password');
    }

    public function getHeading(): string | Htmlable
    {
        return __('Reset Password');
    }

    public function getSubheading(): string | Htmlable | null
    {
        return __('Enter the verification code sent to your phone.');
    }

    /**
     * Override to verify OTP and reset the password.
     */
    public function resetPassword(): ?PasswordResetResponse
    {
        try {
            $this->rateLimit(5);
        } catch (TooManyRequestsException $exception) {
            $this->getRateLimitedNotification($exception)?->send();

            return null;
        }

        $data = $this->form->getState();

        try {
            // Verify the OTP
            $otpRecord = self::findOtpRecord($data['otp']);

            if (! $otpRecord) {
                Notification::make()
                    ->title(__('Invalid verification code!'))
                    ->danger()
                    ->send();

                return null;
            }

            // Check expiry
            if (\Carbon\Carbon::parse($otpRecord->otp_expires_at)->isPast()) {
                self::deleteOtp($data['otp']);

                Notification::make()
                    ->title(__('Your verification code has expired. Please request a new one.'))
                    ->danger()
                    ->send();

                return null;
            }

            // Find user by email (passed via URL) or phone matching the OTP record
            $user = User::withoutGlobalScopes()
                ->where('email', $this->email)
                ->orWhere('phone', $otpRecord->phone)
                ->first();

            if (! $user) {
                Notification::make()
                    ->title(__('User not found!'))
                    ->danger()
                    ->send();

                return null;
            }

            // Check if user account is active
            if (! $user->is_active) {
                Notification::make()
                    ->title(__('auth.account_deactivated'))
                    ->danger()
                    ->send();

                return null;
            }

            // Update password
            $user->forceFill([
                'password' => Hash::make($data['password']),
            ])->save();

            // Delete the used OTP
            self::deleteOtp($data['otp']);

            // Log in the user
            Filament::auth()->login($user);

            // Send confirmation SMS (non-blocking)
            try {
                $message = 'Your password has been successfully changed. If you did not make this change, please contact support immediately.';
                dispatch(new SendSmsJob($user->phone, $message));
            } catch (\Exception $e) {
                Log::warning('Failed to dispatch password change SMS', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $this->form->fill();

            Notification::make()
                ->title(__('Your password has been successfully changed.'))
                ->success()
                ->send();

            return app(PasswordResetResponse::class);
        } catch (\Exception $e) {
            Log::error('Password reset failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            Notification::make()
                ->title(__('An error occurred. Please try again later.'))
                ->danger()
                ->send();

            return null;
        }
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                $this->getOtpFormComponent(),
                $this->getPasswordFormComponent(),
                $this->getPasswordConfirmationFormComponent(),
            ]);
    }

    protected function getOtpFormComponent(): Component
    {
        return TextInput::make('otp')
            ->label(__('Verification Code'))
            ->placeholder(__('Enter 6-digit code'))
            ->required()
            ->numeric()
            ->minLength(6)
            ->maxLength(6)
            ->autocomplete('one-time-code')
            ->autofocus();
    }

    protected function getPasswordFormComponent(): Component
    {
        return TextInput::make('password')
            ->label(__('filament-panels::auth/pages/password-reset/reset-password.form.password.label'))
            ->password()
            ->revealable(filament()->arePasswordsRevealable())
            ->required()
            ->rule(PasswordRule::default())
            ->same('passwordConfirmation')
            ->validationAttribute(__('filament-panels::auth/pages/password-reset/reset-password.form.password.validation_attribute'));
    }

    protected function getPasswordConfirmationFormComponent(): Component
    {
        return TextInput::make('passwordConfirmation')
            ->label(__('filament-panels::auth/pages/password-reset/reset-password.form.password_confirmation.label'))
            ->password()
            ->revealable(filament()->arePasswordsRevealable())
            ->required()
            ->dehydrated(false);
    }

    protected function getFormActions(): array
    {
        return [
            $this->getResetPasswordFormAction(),
        ];
    }

    public function getResetPasswordFormAction(): Action
    {
        return Action::make('resetPassword')
            ->label(__('Reset Password'))
            ->submit('resetPassword')
            ->extraAttributes(['class' => 'w-full']);
    }
}
