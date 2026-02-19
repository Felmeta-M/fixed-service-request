<?php

namespace App\Filament\Resources\AvailableDevices;

use App\Filament\Resources\AvailableDevices\Pages\CreateAvailableDevice;
use App\Filament\Resources\AvailableDevices\Pages\EditAvailableDevice;
use App\Filament\Resources\AvailableDevices\Pages\ListAvailableDevices;
use App\Filament\Resources\AvailableDevices\Pages\ViewAvailableDevice;
use App\Filament\Resources\AvailableDevices\Schemas\AvailableDeviceForm;
use App\Filament\Resources\AvailableDevices\Schemas\AvailableDeviceInfolist;
use App\Filament\Resources\AvailableDevices\Tables\AvailableDevicesTable;
use App\Models\AvailableDevice;
use BackedEnum;
use UnitEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class AvailableDeviceResource extends Resource
{
    protected static ?string $model = AvailableDevice::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::DeviceTablet;
    protected static string|UnitEnum|null $navigationGroup = 'Service Management';

    protected static bool $shouldRegisterNavigation = false;
    protected static ?int $navigationSort = 7;

    public static function form(Schema $schema): Schema
    {
        return AvailableDeviceForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return AvailableDeviceInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return AvailableDevicesTable::configure($table);
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
            'index' => ListAvailableDevices::route('/'),
            'create' => CreateAvailableDevice::route('/create'),
            'view' => ViewAvailableDevice::route('/{record}'),
            'edit' => EditAvailableDevice::route('/{record}/edit'),
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
