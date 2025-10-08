<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Crypt\RSA;

class TelebirrSignerService
{
    protected string $privateKey;
    protected array $excludeFields;

    public function __construct()
    {
        $this->privateKey = config('services.telebirr.private_key'); //file_get_contents(config('telebirr.private_key_path')); 
        $this->excludeFields = config('telebirr.exclude_fields');
    }

    // public function sign(array $request): string
    // {
    //     $string = $this->buildString($request);
    //     $sortedString = $this->sortedString($string);
    //     return $this->signWithRSA($sortedString);
    // }

    public function sign($request)
    {
        $exclude_fields = array("sign", "sign_type", "header", "refund_info", "openType", "raw_request");
        $data = $request;
        ksort($data);
        $stringApplet = '';
        foreach ($data as $key => $values) {
            if (in_array($key, $exclude_fields)) {
                continue;
            }

            if ($key == "biz_content") {
                foreach ($values as $value => $single_value) {
                    if ($stringApplet == '') {
                        $stringApplet = $value . '=' . $single_value;
                    } else {
                        $stringApplet = $stringApplet . '&' . $value . '=' . $single_value;
                    }
                }
            } else {
                if ($stringApplet == '') {
                    $stringApplet = $key . '=' . $values;
                } else {
                    $stringApplet = $stringApplet . '&' . $key . '=' . $values;
                }
            }
        }

        $sortedString = $this->sortedString($stringApplet);

        return $this->signWithRSA($sortedString);
    }

    function sortedString($stringApplet)
    {
        $stringExplode = '';
        $sortedArray = explode("&", $stringApplet);
        sort($sortedArray);
        foreach ($sortedArray as $x => $x_value) {
            if ($stringExplode == '') {
                $stringExplode = $x_value;
            } else {
                $stringExplode = $stringExplode . '&' . $x_value;
            }
        }

        return $stringExplode;
    }

    public function signWithRSA(string $data): ?string
    {

        $privateKeyPath = storage_path('app/keys/private.pem');

        if (!file_exists($privateKeyPath)) {
            \Log::error('Private key file not found at: ' . $privateKeyPath);
        } else {
            $privateKey = file_get_contents($privateKeyPath);
            \Log::info('Private key length: ' . strlen($privateKey));
        }

        try {
            $rsa = PublicKeyLoader::loadPrivateKey($privateKey)
                ->withPadding(RSA::SIGNATURE_PKCS1) // PKCS#1 v1.5, same as old company code
                ->withHash('sha256');

            $signatureByte = $rsa->sign($data);

            return base64_encode($signatureByte);
        } catch (\Exception $e) {
            \Log::error('Error loading private key: ' . $e->getMessage());
            return null;
        }
    }
}
