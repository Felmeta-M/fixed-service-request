<?php

namespace App\Filament\Resources\EthioZones;

use App\Filament\Resources\EthioZones\Pages\CreateEthioZone;
use App\Filament\Resources\EthioZones\Pages\EditEthioZone;
use App\Filament\Resources\EthioZones\Pages\ListEthioZones;
use App\Filament\Resources\EthioZones\Pages\ViewEthioZone;
use App\Filament\Resources\EthioZones\Schemas\EthioZoneForm;
use App\Filament\Resources\EthioZones\Schemas\EthioZoneInfolist;
use App\Filament\Resources\EthioZones\Tables\EthioZonesTable;
use App\Models\EthioZone;
use BackedEnum;
use UnitEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class EthioZoneResource extends Resource
{
    protected static ?string $model = EthioZone::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::MapPin;
    protected static string|UnitEnum|null $navigationGroup = 'Service Management';

    protected static ?int $navigationSort = 5;

    protected static bool $shouldRegisterNavigation = false;

    public static function form(Schema $schema): Schema
    {
        return EthioZoneForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return EthioZoneInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return EthioZonesTable::configure($table);
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
            'index' => ListEthioZones::route('/'),
            'create' => CreateEthioZone::route('/create'),
            'view' => ViewEthioZone::route('/{record}'),
            'edit' => EditEthioZone::route('/{record}/edit'),
        ];
    }

    public static function getRecordRouteBindingEloquentQuery(): Builder
    {
        return parent::getRecordRouteBindingEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }
}
