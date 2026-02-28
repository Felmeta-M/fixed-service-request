<?php

namespace App\Services\Security;

use App\Exceptions\AuthenticationException;
use App\Services\Logging\AppLogger;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Secure OTP Service
 *
 * Features:
 * - Cryptographically secure OTP generation
 * - Hashed OTP storage (never store plain text)
 * - Rate limiting per phone and IP
 * - Brute force protection
 * - Automatic expiry cleanup
 * - No sensitive data in logs
 */
class SecureOtpService
{
    protected int $otpLength = 6;
    protected int $expiryMinutes = 5;
    protected int $maxAttempts = 3;
    protected int $rateLimitPerPhone = 3; // per 5 minutes
    protected int $rateLimitPerIp = 5; // per minute
    protected int $lockoutMinutes = 15;

    /**
     * Generate and store a secure OTP
     */
    public function generate(string $phone, ?string $ip = null): array
    {
        $phone = $this->normalizePhone($phone);
        $ip = $ip ?? request()?->ip() ?? 'unknown';

        // Apply rate limiting
        $this->applyRateLimits($phone, $ip);

        // Generate cryptographically secure OTP
        $otp = $this->generateSecureOtp();

        // Store hashed OTP
        $this->storeOtp($phone, $otp);

        // Log generation (without OTP value)
        AppLogger::auth()->info('OTP generated', [
            'phone_masked' => $this->maskPhone($phone),
            'ip' => $ip,
            'expires_in_minutes' => $this->expiryMinutes,
        ]);

        return [
            'otp' => $otp, // Return to caller for sending via SMS
            'expires_at' => now()->addMinutes($this->expiryMinutes),
            'phone' => $phone,
        ];
    }

    /**
     * Verify an OTP
     */
    public function verify(string $phone, string $otp, ?string $ip = null): bool
    {
        $phone = $this->normalizePhone($phone);
        $ip = $ip ?? request()?->ip() ?? 'unknown';

        // Check for brute force lockout
        $this->checkLockout($phone, $ip);

        // Find the OTP record
        $record = DB::table('otps')
            ->where('phone_number', $phone)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            $this->recordFailedAttempt($phone, $ip);
            AppLogger::security()->warning('OTP verification failed - no valid OTP', [
                'phone_masked' => $this->maskPhone($phone),
                'ip' => $ip,
            ]);
            return false;
        }

        // Verify the hashed OTP
        if (!hash_equals($record->code, $this->hashOtp($otp))) {
            $this->recordFailedAttempt($phone, $ip);
            AppLogger::security()->warning('OTP verification failed - invalid code', [
                'phone_masked' => $this->maskPhone($phone),
                'ip' => $ip,
                'attempts' => $this->getAttemptCount($phone, $ip),
            ]);
            return false;
        }

        // OTP is valid - delete it (single use)
        DB::table('otps')
            ->where('phone_number', $phone)
            ->delete();

        // Clear failed attempts
        $this->clearFailedAttempts($phone, $ip);

        AppLogger::auth()->info('OTP verified successfully', [
            'phone_masked' => $this->maskPhone($phone),
            'ip' => $ip,
        ]);

        return true;
    }

    /**
     * Generate a cryptographically secure OTP
     */
    protected function generateSecureOtp(): string
    {
        // Use random_int for cryptographically secure random numbers
        $max = (10 ** $this->otpLength) - 1;
        $otp = random_int(0, $max);

        return str_pad((string) $otp, $this->otpLength, '0', STR_PAD_LEFT);
    }

    /**
     * Hash OTP for storage
     */
    protected function hashOtp(string $otp): string
    {
        // Use SHA-256 with app key as salt for additional security
        return hash_hmac('sha256', $otp, config('app.key'));
    }

    /**
     * Store OTP in database (hashed)
     */
    protected function storeOtp(string $phone, string $otp): void
    {
        DB::transaction(function () use ($phone, $otp) {
            // Delete any existing OTPs for this phone
            DB::table('otps')
                ->where('phone_number', $phone)
                ->delete();

            // Store new hashed OTP
            DB::table('otps')->insert([
                'phone_number' => $phone,
                'code' => $this->hashOtp($otp),
                'expires_at' => now()->addMinutes($this->expiryMinutes),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    /**
     * Apply rate limits
     */
    protected function applyRateLimits(string $phone, string $ip): void
    {
        $phoneKey = "otp:phone:{$phone}";
        $ipKey = "otp:ip:{$ip}";

        // Check phone rate limit
        if (RateLimiter::tooManyAttempts($phoneKey, $this->rateLimitPerPhone)) {
            $retryAfter = RateLimiter::availableIn($phoneKey);

            AppLogger::security()->warning('OTP rate limit exceeded (phone)', [
                'phone_masked' => $this->maskPhone($phone),
                'retry_after' => $retryAfter,
            ]);

            throw AuthenticationException::otpRateLimited($retryAfter);
        }

        // Check IP rate limit
        if (RateLimiter::tooManyAttempts($ipKey, $this->rateLimitPerIp)) {
            $retryAfter = RateLimiter::availableIn($ipKey);

            AppLogger::security()->warning('OTP rate limit exceeded (IP)', [
                'ip' => $ip,
                'retry_after' => $retryAfter,
            ]);

            throw AuthenticationException::otpRateLimited($retryAfter);
        }

        // Record this attempt
        RateLimiter::hit($phoneKey, 300); // 5 minutes
        RateLimiter::hit($ipKey, 60); // 1 minute
    }

    /**
     * Check for brute force lockout
     */
    protected function checkLockout(string $phone, string $ip): void
    {
        $lockoutKey = "otp:lockout:{$phone}:{$ip}";

        if (RateLimiter::tooManyAttempts($lockoutKey, $this->maxAttempts)) {
            $retryAfter = RateLimiter::availableIn($lockoutKey);

            AppLogger::security()->error('OTP brute force lockout', [
                'phone_masked' => $this->maskPhone($phone),
                'ip' => $ip,
                'lockout_minutes' => $this->lockoutMinutes,
            ]);

            throw AuthenticationException::otpRateLimited($retryAfter);
        }
    }

    /**
     * Record a failed verification attempt
     */
    protected function recordFailedAttempt(string $phone, string $ip): void
    {
        $lockoutKey = "otp:lockout:{$phone}:{$ip}";
        RateLimiter::hit($lockoutKey, $this->lockoutMinutes * 60);
    }

    /**
     * Get current attempt count
     */
    protected function getAttemptCount(string $phone, string $ip): int
    {
        $lockoutKey = "otp:lockout:{$phone}:{$ip}";
        return RateLimiter::attempts($lockoutKey);
    }

    /**
     * Clear failed attempts after successful verification
     */
    protected function clearFailedAttempts(string $phone, string $ip): void
    {
        $lockoutKey = "otp:lockout:{$phone}:{$ip}";
        RateLimiter::clear($lockoutKey);
    }

    /**
     * Normalize phone number
     */
    protected function normalizePhone(string $phone): string
    {
        // Remove all non-digits
        $phone = preg_replace('/\D/', '', $phone);

        // Take last 9 digits (Ethiopian format)
        return substr($phone, -9);
    }

    /**
     * Mask phone for logging
     */
    protected function maskPhone(string $phone): string
    {
        if (strlen($phone) <= 4) {
            return '****';
        }

        return str_repeat('*', strlen($phone) - 4) . substr($phone, -4);
    }

    /**
     * Clean up expired OTPs in chunks to avoid long locks and memory use at scale (e.g. millions of rows).
     */
    public function cleanupExpired(): int
    {
        $totalDeleted = 0;
        $chunkSize = 1000;

        DB::table('otps')
            ->where('expires_at', '<', now())
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use (&$totalDeleted) {
                $ids = $rows->pluck('id')->all();
                if (! empty($ids)) {
                    $totalDeleted += DB::table('otps')->whereIn('id', $ids)->delete();
                }
            }, 'id');

        return $totalDeleted;
    }
}
