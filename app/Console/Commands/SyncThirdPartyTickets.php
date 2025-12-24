<?php

namespace App\Console\Commands;

use App\Jobs\QueryTTJob;
use App\Models\TroubleTicket;
use Illuminate\Console\Command;

class SyncThirdPartyTickets extends Command
{
    protected $signature = 'tickets:sync';
    protected $description = 'Sync trouble ticket status from third-party system';

    public function handle()
    {
        TroubleTicket::whereIn('status', ['pending', 'in_progress'])
            ->where(function ($q) {
                $q->whereNull('last_checked_at')
                    ->orWhere('last_checked_at', '<=', now()->subMinutes(5));
            })
            ->chunk(50, function ($tickets) {
                foreach ($tickets as $ticket) {
                    QueryTTJob::dispatch($ticket->id);
                }
            });

        $this->info('Tickets queued for sync.');
    }
}
