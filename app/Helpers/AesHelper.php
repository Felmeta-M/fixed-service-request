<?php

namespace App\Helpers;

class AesHelper
{
    private const CIPHER = 'AES-128-CBC';
    private const IV     = "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"; // 16 null bytes (skip IV)

    /**
     * Encrypt plain text with AES-128-CBC and return Base64 string.
     */
    public static function encrypt(string $plaintext, string $key): string
    {
        if (strlen($key) !== 16) {
            throw new \InvalidArgumentException("Key must be exactly 16 bytes for AES-128.");
        }

        $ciphertext = openssl_encrypt(
            $plaintext,
            self::CIPHER,
            $key,
            OPENSSL_RAW_DATA,
            self::IV
        );

        if ($ciphertext === false) {
            throw new \RuntimeException("Encryption failed.");
        }

        return base64_encode($ciphertext);
    }

    /**
     * Decrypt Base64-encoded AES-128-CBC ciphertext back to plain text.
     */
    public static function decrypt(string $base64Ciphertext, string $key): string
    {
        if (strlen($key) !== 16) {
            throw new \InvalidArgumentException("Key must be exactly 16 bytes for AES-128.");
        }

        $decoded = base64_decode($base64Ciphertext, true);
        if ($decoded === false) {
            throw new \InvalidArgumentException("Invalid Base64 input.");
        }

        $plaintext = openssl_decrypt(
            $decoded,
            self::CIPHER,
            $key,
            OPENSSL_RAW_DATA,
            self::IV
        );

        if ($plaintext === false) {
            throw new \RuntimeException("Decryption failed.");
        }

        return $plaintext;
    }
}
