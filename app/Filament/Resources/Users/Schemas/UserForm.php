<?php

namespace App\Filament\Resources\Users\Schemas;

use App\Models\EthioZone;
use App\Models\TelecomRegion;
use App\Models\User;
use Filament\Actions\Action;
use Filament\Forms\Components\Field;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Database\Eloquent\Builder;
use Spatie\Permission\Models\Role;

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
                    ->dehydrateStateUsing(fn ($state) => User::normalizePhone($state))
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
                Select::make('roles')
                    ->relationship('roles', 'name', modifyQueryUsing: function (Builder $query) {
                        $query->where('name', '!=', 'super_admin');
                    })
                    ->multiple()
                    ->required()
                    ->preload()
                    ->searchable()
                    ->default(function () {
                        $guestRole = Role::where('name', 'guest')->where('guard_name', 'web')->first();
                        return $guestRole ? [$guestRole->id] : [];
                    })
                    ->columnSpanFull(),

                Section::make('Zone & Area Scope')
                    ->description('Assign ethio zones and areas this user can access. Survey orders will be filtered by these areas.')
                    ->schema([
                        Select::make('zones')
                            ->label('Ethio Zones')
                            ->options(fn () => EthioZone::where('status', true)->orderBy('name')->pluck('name', 'name'))
                            ->multiple()
                            ->preload()
                            ->searchable()
                            ->live()
                            ->afterStateUpdated(function (Set $set) {
                                $set('areas', []);
                            })
                            ->hintAction(
                                Action::make('selectAllZones')
                                    ->label('Select All')
                                    ->icon('heroicon-m-check')
                                    ->action(function (Set $set) {
                                        $set('zones', EthioZone::where('status', true)->pluck('name')->toArray());
                                        $set('areas', []);
                                    })
                            )
                            ->columnSpanFull(),

                        Select::make('areas')
                            ->label('Areas (by Area ID)')
                            ->options(function (Get $get) {
                                $zones = $get('zones');
                                if (empty($zones)) {
                                    return TelecomRegion::where('status', true)
                                        ->orderBy('area_name')
                                        ->pluck('area_name', 'area_id');
                                }

                                return TelecomRegion::where('status', true)
                                    ->whereIn('zone', $zones)
                                    ->orderBy('area_name')
                                    ->pluck('area_name', 'area_id');
                            })
                            ->multiple()
                            ->preload()
                            ->searchable()
                            ->hintAction(
                                Action::make('selectAllAreas')
                                    ->label('Select All')
                                    ->icon('heroicon-m-check')
                                    ->action(function (Get $get, Set $set) {
                                        $zones = $get('zones');
                                        $query = TelecomRegion::where('status', true);
                                        if (! empty($zones)) {
                                            $query->whereIn('zone', $zones);
                                        }
                                        $set('areas', $query->pluck('area_id')->map(fn ($v) => (string) $v)->toArray());
                                    })
                            )
                            ->columnSpanFull(),
                    ])
                    ->columns(1)
                    ->columnSpanFull(),

                Toggle::make('is_active')
                    ->label('Active')
                    ->helperText('Inactive users cannot log in to the panel.')
                    ->default(true)
                    ->columnSpanFull(),
            ]);
    }
}
