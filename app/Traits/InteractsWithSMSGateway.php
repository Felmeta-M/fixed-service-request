<?php

namespace App\Traits;

use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

trait InteractsWithSMSGateway
{
    public static function sendSmsOnly(string|int $phone, $message = null): bool|string
    {
        $encodedMessage = urlencode($message);
        $phone = substr($phone, -9);
        $encodedPhoneNumber = urlencode("251{$phone}");

        $smsEndPoint = config('services.sms_end_point');
        $url = "{$smsEndPoint}{$encodedPhoneNumber}&message={$encodedMessage}";

        return self::sendRequest($url);
    }

    protected static function sendRequest(string $url): bool|string
    {
        try {
            $response = Http::get($url);
            if ($response->successful()) {
                return true;
            }
            return false;
        } catch (Exception $e) {
            // Log the error in case of an exception
            Log::error("HTTP request error occurred: ", ['error' => $e->getMessage()]);
        }

        return false;
    }

    public static function sendOTP(string $phone, $message = null)
    {
        try {
            $phone = substr($phone, -9);
            $otp = self::OTP();
            $message = "Your verification code is {$otp}. It will expire in 5 minutes. Do not share this code with anyone.";
            $encodedMessage = urlencode("{$message}");
            $encodedPhoneNumber = urlencode("251{$phone}");
            $smsEndPoint = config('services.sms_end_point');
            $url = "{$smsEndPoint}{$encodedPhoneNumber}&message={$encodedMessage}";

            self::setOTP($phone, $otp);

            $response = self::sendRequest($url);
            if ($response) {
                return response()->json([
                    'success' => true,
                    'message' => 'OTP successfully sent'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'OTP could not be sent'
                ], 500);
            }
        } catch (Throwable $th) {
            Log::info($th->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'OTP could not be sent'
            ], 500);
        }
    }

    public static function OTP(string|int $length = 6): string
    {
        $characters = '123456789';
        $charactersLength = strlen($characters);
        $code = '';
        for ($i = 0; $i < (int)$length; $i++) {
            $code .= $characters[rand(0, $charactersLength - 1)];
        }

        return $code;
    }

    public static function setOTP($phone = null, $code = null): string
    {
        $otp = $code ?: self::OTP();

        DB::table('service_clients')->where('phone', $phone)->delete();

        DB::table('service_clients')->insert([
            'phone' => $phone,
            'otp_code' => sha1($otp),
            'otp_expires_at' => Carbon::now()->addMinutes(5)
        ]);

        return $otp;
    }

    public static function verifyOTP(string $otp)
    {
        $otpRecord = self::findOTP($otp);

        if (!$otpRecord) {
            return [
                'success' => false,
                'message' => 'Invalid verification code.'
            ];
        }

        if (Carbon::parse($otpRecord->otp_expires_at)->isPast()) {
            return [
                'success' => false,
                'message' => 'Verification code has expired.'
            ];
        }

        return [
            'success' => true,
            'message' => 'Verification successful.',
            'data' => [
                'otp_code' => $otpRecord->otp_code,
            ]
        ];
    }

    public static function findOTP(string $otp)
    {
        return DB::table('service_clients')
            ->where('otp_code', sha1($otp))
            ->first();
    }

    public static function deleteOTP(string $otp): int
    {
        return DB::table('service_clients')->where('otp_code', sha1($otp))->delete();
    }

    public static function ensurePhoneIsLocal(string|int $phone): bool|int
    {
        $pattern = "/^(\+251|251|0)?(9|7)(\d){8}$/";

        return preg_match($pattern, $phone);
    }
}
