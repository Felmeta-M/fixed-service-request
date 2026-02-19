<?php

namespace App\Filament\Resources\BandwidthOptions;

use App\Filament\Resources\BandwidthOptions\Pages\CreateBandwidthOption;
use App\Filament\Resources\BandwidthOptions\Pages\EditBandwidthOption;
use App\Filament\Resources\BandwidthOptions\Pages\ListBandwidthOptions;
use App\Filament\Resources\BandwidthOptions\Pages\ViewBandwidthOption;
use App\Filament\Resources\BandwidthOptions\Schemas\BandwidthOptionForm;
use App\Filament\Resources\BandwidthOptions\Schemas\BandwidthOptionInfolist;
use App\Filament\Resources\BandwidthOptions\Tables\BandwidthOptionsTable;
use App\Models\BandwidthOption;
use BackedEnum;
use UnitEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class BandwidthOptionResource extends Resource
{
    protected static ?string $model = BandwidthOption::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::GlobeAlt;
    protected static string|UnitEnum|null $navigationGroup = 'Service Management';

    protected static ?int $navigationSort = 3;


    protected static bool $shouldRegisterNavigation = false;

    public static function form(Schema $schema): Schema
    {
        return BandwidthOptionForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return BandwidthOptionInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return BandwidthOptionsTable::configure($table);
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
            'index' => ListBandwidthOptions::route('/'),
            'create' => CreateBandwidthOption::route('/create'),
            'view' => ViewBandwidthOption::route('/{record}'),
            'edit' => EditBandwidthOption::route('/{record}/edit'),
        ];
    }
}
