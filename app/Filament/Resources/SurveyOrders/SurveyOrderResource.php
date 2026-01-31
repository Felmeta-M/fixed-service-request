<?php

namespace App\Filament\Resources\SurveyOrders;

use App\Filament\Resources\SurveyOrders\Pages\CreateSurveyOrder;
use App\Filament\Resources\SurveyOrders\Pages\EditSurveyOrder;
use App\Filament\Resources\SurveyOrders\Pages\ListSurveyOrders;
use App\Filament\Resources\SurveyOrders\Pages\ViewSurveyOrder;
use App\Filament\Resources\SurveyOrders\Schemas\SurveyOrderForm;
use App\Filament\Resources\SurveyOrders\Schemas\SurveyOrderInfolist;
use App\Filament\Resources\SurveyOrders\Tables\SurveyOrdersTable;
use App\Models\SurveyOrder;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use UnitEnum;

class SurveyOrderResource extends Resource
{
    protected static ?string $model = SurveyOrder::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::Square2Stack;
    protected static string|UnitEnum|null $navigationGroup = 'Service Management';

    public static function form(Schema $schema): Schema
    {
        return SurveyOrderForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return SurveyOrderInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return SurveyOrdersTable::configure($table);
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
            'index' => ListSurveyOrders::route('/'),
            'create' => CreateSurveyOrder::route('/create'),
            'view' => ViewSurveyOrder::route('/{record}'),
            'edit' => EditSurveyOrder::route('/{record}/edit'),
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
