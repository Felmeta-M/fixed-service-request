<?php

namespace App\Traits;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Throwable;

trait InteractsWithSMSGateway
{
    /* -----------------------------------------------------------------
     |  Public API
     | -----------------------------------------------------------------
     */

    public static function sendSmsOnly(string|int $phone, string $message): void
    {
        self::applySmsRateLimit($phone);

        $phone = self::normalizePhone($phone);

        \App\Jobs\SendSmsJob::dispatch($phone, $message);
    }

    public static function sendOTP(string|int $phone): string
    {
        self::applyOtpRateLimit($phone);

        $phone = self::normalizePhone($phone);

        $otp = self::generateOtp();
        self::storeOtp($phone, $otp);

        $message = "Your verification code is {$otp}. It expires in 5 minutes.";

        \App\Jobs\SendSmsJob::dispatch($phone, $message);

        return $otp;
    }

    public static function verifyOTP(string $otp): bool
    {
        $record = self::findOtpRecord($otp);

        if (! $record) {
            return false;
        }

        if (Carbon::parse($record->otp_expires_at)->isPast()) {
            self::deleteOtp($otp);
            return false;
        }

        self::deleteOtp($otp);

        return true;
    }

    /* -----------------------------------------------------------------
     |  Rate Limiting
     | -----------------------------------------------------------------
     */

    protected static function applySmsRateLimit(string|int $phone): void
    {
        // Skip rate limit when running in console (queue jobs, artisan) so batch notifications can be sent
        if (app()->runningInConsole()) {
            return;
        }

        $phoneKey = 'sms:phone:' . self::normalizePhone($phone);
        $ipKey = 'sms:ip:' . self::requestIp();

        if (
            RateLimiter::tooManyAttempts($ipKey, 3) ||
            RateLimiter::tooManyAttempts($phoneKey, 5)
        ) {
            throw new \RuntimeException('SMS rate limit exceeded.');
        }

        RateLimiter::hit($ipKey, 60);
        RateLimiter::hit($phoneKey, 3600);
    }

    protected static function applyOtpRateLimit(string|int $phone): void
    {
        $key = 'otp:phone:' . self::normalizePhone($phone);

        if (RateLimiter::tooManyAttempts($key, 3)) {
            throw new \RuntimeException('OTP rate limit exceeded.');
        }

        RateLimiter::hit($key, 300);
    }

    /* -----------------------------------------------------------------
     |  OTP Logic
     | -----------------------------------------------------------------
     */

    protected static function generateOtp(int $length = 6): string
    {
        return str_pad(
            (string) random_int(0, (10 ** $length) - 1),
            $length,
            '0',
            STR_PAD_LEFT
        );
    }

    protected static function storeOtp(string $phone, string $otp): void
    {
        DB::transaction(function () use ($phone, $otp) {
            DB::table('service_clients')->where('phone', $phone)->delete();

            DB::table('service_clients')->insert([
                'phone' => $phone,
                'otp_code' => hash('sha256', $otp),
                'otp_expires_at' => Carbon::now()->addMinutes(5),
                'created_at' => now(),
            ]);
        });
    }

    protected static function findOtpRecord(string $otp)
    {
        return DB::table('service_clients')
            ->where('otp_code', hash('sha256', $otp))
            ->first();
    }

    protected static function deleteOtp(string $otp): int
    {
        return DB::table('service_clients')
            ->where('otp_code', hash('sha256', $otp))
            ->delete();
    }

    /* -----------------------------------------------------------------
     |  SMS Transport
     | -----------------------------------------------------------------
     */

    protected static function sendRequest(string $url): bool
    {
        try {
            return Http::logged('SMSGateway', 'api')
                ->timeout(10)
                ->get($url)
                ->successful();
        } catch (Throwable $e) {
            Log::error('SMS gateway request failed', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    protected static function buildSmsUrl(string $phone, string $message): string
    {
        $endpoint = config('services.sms_endpoint');

        return sprintf(
            '%s%s&message=%s',
            $endpoint,
            urlencode("251{$phone}"),
            urlencode($message)
        );
    }

    /* -----------------------------------------------------------------
     |  Helpers
     | -----------------------------------------------------------------
     */

    public static function normalizePhone(string|int $phone): string
    {
        $phone = preg_replace('/\D/', '', (string) $phone);

        return substr($phone, -9);
    }

    protected static function requestIp(): string
    {
        return request()?->ip() ?? 'cli';
    }

    public static function ensurePhoneIsLocal(string|int $phone): bool
    {
        return (bool) preg_match("/^(\+251|251|0)?(9|7)\d{8}$/", $phone);
    }
}
