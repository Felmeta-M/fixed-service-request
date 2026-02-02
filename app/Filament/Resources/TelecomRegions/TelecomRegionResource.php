<?php

namespace App\Filament\Resources\TelecomRegions;

use App\Filament\Resources\TelecomRegions\Pages\CreateTelecomRegion;
use App\Filament\Resources\TelecomRegions\Pages\EditTelecomRegion;
use App\Filament\Resources\TelecomRegions\Pages\ListTelecomRegions;
use App\Filament\Resources\TelecomRegions\Pages\ViewTelecomRegion;
use App\Filament\Resources\TelecomRegions\Schemas\TelecomRegionForm;
use App\Filament\Resources\TelecomRegions\Schemas\TelecomRegionInfolist;
use App\Filament\Resources\TelecomRegions\Tables\TelecomRegionsTable;
use App\Models\TelecomRegion;
use BackedEnum;
use UnitEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class TelecomRegionResource extends Resource
{
    protected static ?string $model = TelecomRegion::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::MapPin;
    protected static string|UnitEnum|null $navigationGroup = 'Service Management';
    protected static ?int $navigationSort = 4;

    public static function form(Schema $schema): Schema
    {
        return TelecomRegionForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return TelecomRegionInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TelecomRegionsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListTelecomRegions::route('/'),
            'create' => CreateTelecomRegion::route('/create'),
            'view' => ViewTelecomRegion::route('/{record}'),
            'edit' => EditTelecomRegion::route('/{record}/edit'),
        ];
    }
}
