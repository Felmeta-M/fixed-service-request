<?php

namespace App\Console\Commands;

use App\Jobs\QueryTTJob;
use App\Models\TroubleTicket;
use Illuminate\Console\Command;
use App\Services\Logging\AppLogger;

class SyncThirdPartyTickets extends Command
{
    protected $signature = 'tickets:sync';
    protected $description = 'Sync trouble ticket status from third-party system';

    public function handle()
    {
        $query = TroubleTicket::whereNotIn('status', ['closed'])
            ->where(function ($q) {
                $q->whereNull('last_checked_at')
                    ->orWhere('last_checked_at', '<=', now()->subMinutes(15));
            })
            ->orderBy('id');

        // AppLogger::business()->info('SyncThirdPartyTickets: started', [
        //     'operation' => 'tickets_sync',
        // ]);

        $dispatched = 0;
        $chunkSize = 100;
        $query->chunkById($chunkSize, function ($tickets) use (&$dispatched) {
            foreach ($tickets as $ticket) {
                QueryTTJob::dispatch($ticket->id);
                $dispatched++;
            }
        });

        // AppLogger::business()->info('SyncThirdPartyTickets: completed', [
        //     'operation' => 'tickets_sync',
        //     'jobs_dispatched' => $dispatched,
        // ]);
    }
}
