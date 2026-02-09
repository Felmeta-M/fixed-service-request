<?php

namespace App\Filament\Resources\Users\Schemas;

use App\Models\TelecomRegion;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class UserInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('name'),
                TextEntry::make('phone')
                    ->placeholder('-'),
                TextEntry::make('email')
                    ->label('Email address'),
                TextEntry::make('roles.name')
                    ->label(__('Roles'))
                    ->badge()
                    ->placeholder('-'),
                IconEntry::make('is_active')
                    ->label('Status')
                    ->boolean()
                    ->trueIcon('heroicon-o-check-circle')
                    ->falseIcon('heroicon-o-x-circle')
                    ->trueColor('success')
                    ->falseColor('danger'),

                Section::make('Zone & Area Scope')
                    ->schema([
                        TextEntry::make('zones')
                            ->label('Ethio Zones')
                            ->badge()
                            ->placeholder('All zones'),
                        TextEntry::make('areas')
                            ->label('Areas')
                            ->badge()
                            ->getStateUsing(function ($record): array {
                                $areaIds = $record->areas ?? [];
                                if (empty($areaIds)) {
                                    return [];
                                }

                                return TelecomRegion::whereIn('area_id', $areaIds)
                                    ->pluck('area_name')
                                    ->toArray();
                            })
                            ->placeholder('All areas'),
                    ])
                    ->columns(2)
                    ->columnSpanFull(),

                TextEntry::make('email_verified_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('created_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('updated_at')
                    ->dateTime()
                    ->placeholder('-'),
            ]);
    }
}
