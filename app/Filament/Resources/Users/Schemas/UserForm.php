<?php

namespace App\Filament\Resources\Users\Schemas;

use App\Models\User;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Field;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('phone')
                    ->label(__('auth.phone_label'))
                    ->tel()
                    ->placeholder('e.g. 0912345678')
                    ->trim()
                    ->required()
                    ->formatStateUsing(fn ($state) => $state ? User::normalizePhone($state) : null)
                    ->rule(static function (Field $component, $state): \Closure {
                        return function (string $attribute, $value, \Closure $fail) use ($component, $state): void {
                            $normalized = User::normalizePhone($value ?? $state);
                            if (blank($normalized)) {
                                return;
                            }
                            $query = User::query()->where('phone', $normalized);
                            $record = $component->getRecord();
                            if ($record && $record->getKey()) {
                                $query->where('id', '!=', $record->getKey());
                            }
                            if ($query->exists()) {
                                $fail(__('validation.unique', ['attribute' => __('auth.phone_label')]));
                            }
                        };
                    }),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->required()
                    ->rule(static function (Field $component, $state): \Closure {
                        return function (string $attribute, $value, \Closure $fail) use ($component, $state): void {
                            $email = $value ?? $state;
                            if (blank($email)) {
                                return;
                            }
                            $query = User::query()->where('email', strtolower((string) $email));
                            $record = $component->getRecord();
                            if ($record && $record->getKey()) {
                                $query->where('id', '!=', $record->getKey());
                            }
                            if ($query->exists()) {
                                $fail(__('validation.unique', ['attribute' => 'email']));
                            }
                        };
                    }),
                DateTimePicker::make('email_verified_at'),
                Select::make('roles')
                    ->label(__('Roles'))
                    ->multiple()
                    ->relationship(
                        name: 'roles',
                        titleAttribute: 'name',
                        modifyQueryUsing: fn ($query) => $query->where('guard_name', config('auth.defaults.guard', 'web'))
                    )
                    ->preload()
                    ->searchable(),
                TextInput::make('password')
                    ->password()
                    ->required()
                    ->dehydrated(fn ($state) => filled($state))
                    ->visible(fn (Field $component): bool => ! $component->getRecord()?->getKey()),
            ]);
    }
}
