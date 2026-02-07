<?php

namespace App\Filament\Pages;

use App\Jobs\SendSmsJob;
use App\Traits\InteractsWithSMSGateway;
use Closure;
use Filament\Facades\Filament;
use Filament\Forms;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ChangePassword extends Page implements Forms\Contracts\HasForms
{
    use Forms\Concerns\InteractsWithForms;
    use InteractsWithSMSGateway;

    protected string $view = 'filament.pages.change-password';

    protected static bool $shouldRegisterNavigation = false;

    public string $current_password = '';

    public string $new_password = '';

    public string $new_password_confirmation = '';

    protected function getFormSchema(): array
    {
        return [
            TextInput::make('current_password')
                ->label(__('auth.current_password'))
                ->password()
                ->revealable(filament()->arePasswordsRevealable())
                ->required()
                ->rule(function (): Closure {
                    return function (string $attribute, $value, Closure $fail): void {
                        $user = Filament::auth()->user();
                        if (! $user || ! Hash::check($value, $user->getAuthPassword())) {
                            $fail(__('auth.current_password_failed'));
                        }
                    };
                }),

            TextInput::make('new_password')
                ->label(__('auth.new_password'))
                ->password()
                ->revealable(filament()->arePasswordsRevealable())
                ->required()
                ->different('current_password')
                ->rule(Password::defaults()),

            TextInput::make('new_password_confirmation')
                ->label(__('auth.password_confirmation'))
                ->password()
                ->revealable(filament()->arePasswordsRevealable())
                ->required()
                ->same('new_password'),
        ];
    }

    public function submit(): mixed
    {
        $this->validate();

        $user = Filament::auth()->user();
        if (! $user) {
            Notification::make()
                ->title(__('auth.failed'))
                ->danger()
                ->send();
            return null;
        }

        $user->password = $this->new_password;
        $user->save();

        Notification::make()
            ->title(__('auth.password_changed'))
            ->success()
            ->send();

        if ($user->phone) {
            dispatch(new SendSmsJob($user->phone, __('auth.password_changed')));
        }

        Auth::logoutOtherDevices($this->new_password);

        $this->form->fill();

        return redirect()->intended(Filament::getPanel()->getUrl());
    }
}
