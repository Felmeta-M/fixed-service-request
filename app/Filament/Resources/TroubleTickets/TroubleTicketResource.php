<?php

namespace App\Filament\Resources\TroubleTickets;

use App\Filament\Resources\TroubleTickets\Pages\CreateTroubleTicket;
use App\Filament\Resources\TroubleTickets\Pages\EditTroubleTicket;
use App\Filament\Resources\TroubleTickets\Pages\ListTroubleTickets;
use App\Filament\Resources\TroubleTickets\Pages\ViewTroubleTicket;
use App\Filament\Resources\TroubleTickets\Schemas\TroubleTicketForm;
use App\Filament\Resources\TroubleTickets\Schemas\TroubleTicketInfolist;
use App\Filament\Resources\TroubleTickets\Tables\TroubleTicketsTable;
use App\Models\TroubleTicket;
use BackedEnum;
use UnitEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class TroubleTicketResource extends Resource
{
    protected static ?string $model = TroubleTicket::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::Ticket;
    protected static string|UnitEnum|null $navigationGroup = 'Trouble Ticket Management';

    public static function form(Schema $schema): Schema
    {
        return TroubleTicketForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return TroubleTicketInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TroubleTicketsTable::configure($table);
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
            'index' => ListTroubleTickets::route('/'),
            'create' => CreateTroubleTicket::route('/create'),
            'view' => ViewTroubleTicket::route('/{record}'),
            'edit' => EditTroubleTicket::route('/{record}/edit'),
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
