<?php

namespace App\Jobs;

use App\Traits\InteractsWithSMSGateway;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendSmsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    use InteractsWithSMSGateway;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 5;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string|int $phone,
        public string $message
    ) {
        // Send SMS jobs to a dedicated 'sms' queue for better scaling
        $this->onQueue('sms');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $phone = self::normalizePhone($this->phone);
        $url = self::buildSmsUrl($phone, $this->message);
        
        // We call sendRequest directly. 
        // Note: sendRequest logs errors if it fails.
        if (!self::sendRequest($url)) {
            throw new \RuntimeException("Failed to send SMS to {$phone}");
        }
    }
}
