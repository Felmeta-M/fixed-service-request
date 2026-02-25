<?php

namespace App\Jobs;

use App\Models\TroubleTicket;
use App\Services\QueryTTService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class QueryTTJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 20;
    public int $tries = 3;

    public function __construct(private int $ticketId) {}

    public function handle(QueryTTService $service)
    {
        $ticket = TroubleTicket::find($this->ticketId);
        if (!$ticket) return;

        $response = $service->queryTT([
            // Use the ticket's own access number when querying third-party TT status
            'access_number' => $ticket->access_number,
        ]);

        if (!$response['success'] || empty($response['tt_list'])) return;
        $tt = $response['tt_list'][0]; // assume 1 TT per access_number
        $newStatus = strtolower($tt['tt_status']); // match your enum
        Log::channel('tt')->info('TT status updated', [
            'ticket_id' => $ticket->id,
            'old_status' => $ticket->status,
            'new_status' => $newStatus,
        ]);
        if ($ticket->status !== $newStatus) {
            $ticket->update([
                'status' => $newStatus,
                'last_synced_status' => $newStatus,
            ]);
        }

        $ticket->update(['last_checked_at' => now()]);
    }
}
