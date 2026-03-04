<?php

namespace App\Filament\Resources\BandwidthPrices;

use App\Filament\Resources\BandwidthPrices\Pages\CreateBandwidthPrice;
use App\Filament\Resources\BandwidthPrices\Pages\EditBandwidthPrice;
use App\Filament\Resources\BandwidthPrices\Pages\ListBandwidthPrices;
use App\Filament\Resources\BandwidthPrices\Pages\ViewBandwidthPrice;
use App\Filament\Resources\BandwidthPrices\Schemas\BandwidthPriceForm;
use App\Filament\Resources\BandwidthPrices\Schemas\BandwidthPriceInfolist;
use App\Filament\Resources\BandwidthPrices\Tables\BandwidthPricesTable;
use App\Models\BandwidthPrice;
use BackedEnum;
use UnitEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class BandwidthPriceResource extends Resource
{
    protected static ?string $model = BandwidthPrice::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::CurrencyDollar;
    protected static string|UnitEnum|null $navigationGroup = 'Service Management';

    protected static ?int $navigationSort = 4;

    protected static ?string $navigationLabel = 'Bandwidth Prices';

    public static function form(Schema $schema): Schema
    {
        return BandwidthPriceForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return BandwidthPriceInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return BandwidthPricesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListBandwidthPrices::route('/'),
            'create' => CreateBandwidthPrice::route('/create'),
            'view' => ViewBandwidthPrice::route('/{record}'),
            'edit' => EditBandwidthPrice::route('/{record}/edit'),
        ];
    }
}
