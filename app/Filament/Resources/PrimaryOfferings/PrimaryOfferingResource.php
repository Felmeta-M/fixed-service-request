<?php

namespace App\Filament\Resources\PrimaryOfferings;

use App\Filament\Resources\PrimaryOfferings\Pages\CreatePrimaryOffering;
use App\Filament\Resources\PrimaryOfferings\Pages\EditPrimaryOffering;
use App\Filament\Resources\PrimaryOfferings\Pages\ListPrimaryOfferings;
use App\Filament\Resources\PrimaryOfferings\Pages\ViewPrimaryOffering;
use App\Filament\Resources\PrimaryOfferings\Schemas\PrimaryOfferingForm;
use App\Filament\Resources\PrimaryOfferings\Schemas\PrimaryOfferingInfolist;
use App\Filament\Resources\PrimaryOfferings\Tables\PrimaryOfferingsTable;
use App\Models\PrimaryOffering;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class PrimaryOfferingResource extends Resource
{
    protected static ?string $model = PrimaryOffering::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return PrimaryOfferingForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return PrimaryOfferingInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PrimaryOfferingsTable::configure($table);
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
            'index' => ListPrimaryOfferings::route('/'),
            'create' => CreatePrimaryOffering::route('/create'),
            'view' => ViewPrimaryOffering::route('/{record}'),
            'edit' => EditPrimaryOffering::route('/{record}/edit'),
        ];
    }
}
