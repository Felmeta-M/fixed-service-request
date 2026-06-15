<?php

namespace App\Helpers;

use Illuminate\Support\Str;

/**
 * Helper class for generating internet account credentials.
 * Used for Data and Combo subscription services.
 *
 * Configuration: config/services.php -> 'internet_credentials'
 */
class InternetCredentialsHelper
{
    /**
     * Generate internet account username (email format).
     *
     * Pattern options:
     * - 'random': Random alphanumeric string (default)
     * - 'phone': Based on customer phone number
     * - 'uuid': UUID-based username
     * - 'timestamp': Timestamp-based username
     *
     * @param string|null $phone Customer phone number (for phone-based pattern)
     * @param string|null $customerCode Customer code (for custom patterns)
     * @return string Generated email/username
     */
    public static function generateUsername(?string $phone = null, ?string $customerCode = null): string
    {
        $config = config('services.internet_credentials', []);
        $pattern = $config['username_pattern'] ?? 'random';
        $domain = $config['email_domain'] ?? 'ethiotelecom.et';
        $prefix = $config['username_prefix'] ?? 'fbb';

        $username = match ($pattern) {
            'phone' => self::generateFromPhone($phone, $prefix),
            'uuid' => self::generateFromUuid($prefix),
            'timestamp' => self::generateFromTimestamp($prefix),
            'customer_code' => self::generateFromCustomerCode($customerCode, $prefix),
            default => self::generateRandom($prefix),
        };

        return strtolower($username . '@' . $domain);
    }

    /**
     * Generate or retrieve password.
     *
     * @return string Password (encrypted or plain based on config)
     */
    public static function generatePassword(): string
    {
        $config = config('services.internet_credentials', []);

        // If a static password is configured, use it
        if (!empty($config['static_password'])) {
            return $config['static_password'];
        }

        // If encryption is enabled, generate and encrypt
        if ($config['encrypt_password'] ?? false) {
            $plain = self::generateRandomPassword($config['password_length'] ?? 12);
            return self::encryptPassword($plain);
        }

        // Default: generate plain random password
        return self::generateRandomPassword($config['password_length'] ?? 12);
    }

    /**
     * Get the default static password (for backward compatibility).
     *
     * @return string Default encrypted password
     */
    public static function getDefaultPassword(): string
    {
        return config('services.internet_credentials.static_password') ?? self::generateRandomPassword();
    }

    /**
     * Generate credentials as an array.
     *
     * @param string|null $phone Customer phone number
     * @param string|null $customerCode Customer code
     * @return array ['username' => string, 'password' => string]
     */
    public static function generate(?string $phone = null, ?string $customerCode = null): array
    {
        return [
            'username' => self::generateUsername($phone, $customerCode),
            'password' => self::generatePassword(),
        ];
    }

    // ============================================================
    // Username Generation Patterns
    // ============================================================

    /**
     * Random alphanumeric pattern (default).
     * Format: {prefix}{8-char-random}
     */
    protected static function generateRandom(string $prefix): string
    {
        return $prefix . Str::random(8);
    }

    /**
     * Phone-based pattern.
     * Format: {prefix}{last-6-digits}{4-char-random}
     */
    protected static function generateFromPhone(?string $phone, string $prefix): string
    {
        if (empty($phone)) {
            return self::generateRandom($prefix);
        }

        // Get last 6 digits of phone
        $digits = preg_replace('/\D/', '', $phone);
        $suffix = substr($digits, -6);

        return $prefix . $suffix . Str::random(4);
    }

    /**
     * UUID-based pattern.
     * Format: {prefix}{uuid-first-8-chars}
     */
    protected static function generateFromUuid(string $prefix): string
    {
        $uuid = Str::uuid()->toString();
        return $prefix . substr(str_replace('-', '', $uuid), 0, 8);
    }

    /**
     * Timestamp-based pattern.
     * Format: {prefix}{YmdHis}{3-char-random}
     */
    protected static function generateFromTimestamp(string $prefix): string
    {
        return $prefix . date('ymdHis') . Str::random(3);
    }

    /**
     * Customer code-based pattern.
     * Format: {prefix}{customer-code-last-6}{4-char-random}
     */
    protected static function generateFromCustomerCode(?string $customerCode, string $prefix): string
    {
        if (empty($customerCode)) {
            return self::generateRandom($prefix);
        }

        $suffix = substr($customerCode, -6);
        return $prefix . $suffix . Str::random(4);
    }

    // ============================================================
    // Password Generation
    // ============================================================

    /**
     * Generate a random password.
     */
    protected static function generateRandomPassword(int $length = 12): string
    {
        // Mix of uppercase, lowercase, numbers, and special chars
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        return substr(str_shuffle(str_repeat($chars, 3)), 0, $length);
    }

    /**
     * Encrypt password for BSS transmission.
     * Note: This is a placeholder - implement actual encryption as per BSS requirements.
     */
    protected static function encryptPassword(string $plain): string
    {
        // Default: Base64 encode (replace with actual BSS encryption if needed)
        return base64_encode($plain);
    }
}
