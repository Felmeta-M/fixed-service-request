<?php

namespace App\Jobs;

use App\Enums\TicketStatus;
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

        $payload = $response->getData(true);
        $data = $payload['data'] ?? [];
        if (empty($data['success']) || empty($data['tt_list'])) return;

        $tt = $data['tt_list'][0]; // assume 1 TT per access_number
        // Resolve to TicketStatus enum so we never store raw numbers (e.g. 0) — use enum value for DB/UI
        $newStatus = $this->resolveStatus($tt);
        if ($newStatus === null) return;
        // Log::channel('tt')->info('TT status updated', [
        //     'ticket_id' => $ticket->id,
        //     'old_status' => $ticket->status,
        //     'new_status' => $newStatus,
        // ]);
        if ($ticket->status !== $newStatus) {
            $ticket->update([
                'status' => $newStatus,
                'last_synced_status' => $newStatus,
            ]);
        }

        $ticket->update(['last_checked_at' => now()]);
    }

    /**
     * Resolve status to TicketStatus enum value so we never store raw numbers (e.g. 0).
     * Prefers service-resolved value, then fromApiResponse, then numeric mapping, then default.
     */
    private function resolveStatus(array $tt): ?string
    {
        $raw = $tt['status'] ?? null;

        // Already a valid enum string from QueryTTService
        $enum = $raw !== null ? TicketStatus::tryFrom((string) $raw) : null;
        if ($enum !== null) {
            return $enum->value;
        }

        // Resolve from API fields if present (current_activity + tt_status)
        $currentActivity = $tt['current_activity'] ?? $tt['currentActivity'] ?? null;
        $ttStatus = $tt['tt_status'] ?? $tt['ttStatus'] ?? null;
        if ($currentActivity !== null || $ttStatus !== null) {
            return TicketStatus::fromApiResponse($currentActivity, $ttStatus)->value;
        }

        // Numeric from third-party API: map to enum so customers never see "0"
        if (is_numeric($raw)) {
            return match ((int) $raw) {
                0 => TicketStatus::OPEN->value,
                1 => TicketStatus::CONFIRM->value,
                2 => TicketStatus::CLOSED->value,
                default => TicketStatus::OPEN->value,
            };
        }

        return null;
    }
}
