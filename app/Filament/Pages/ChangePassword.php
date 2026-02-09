<?php

namespace App\Filament\Pages;

use App\Jobs\SendSmsJob;
use Closure;
use Filament\Facades\Filament;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ChangePassword extends Page
{
    protected string $view = 'filament.pages.change-password';

    protected static bool $shouldRegisterNavigation = false;

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill();
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
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
            ])
            ->statePath('data');
    }

    public function submit(): mixed
    {
        $data = $this->form->getState();

        $user = Filament::auth()->user();
        if (! $user) {
            Notification::make()
                ->title(__('auth.failed'))
                ->danger()
                ->send();

            return null;
        }

        $user->password = $data['new_password'];
        $user->save();

        Notification::make()
            ->title(__('auth.password_changed'))
            ->success()
            ->send();

        if ($user->phone) {
            dispatch(new SendSmsJob($user->phone, __('auth.password_changed')));
        }

        Auth::logoutOtherDevices($data['new_password']);

        $this->form->fill();

        $panel = Filament::getPanel('admin');

        return redirect()->intended($panel ? $panel->getUrl() : url('/ffd'));
    }
}
