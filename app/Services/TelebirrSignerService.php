<?php

namespace App\Services;

use phpseclib3\Crypt\PublicKeyLoader;

class TelebirrSignerService
{
    protected string $privateKey;
    protected array $excludeFields;

    public function __construct()
    {
        $this->privateKey = file_get_contents(config('telebirr.private_key_path'));  //config('services.telebirr.private_key');
        $this->excludeFields = config('telebirr.exclude_fields');
    }

    public function sign(array $request): string
    {
        $string = $this->buildString($request);
        $sortedString = $this->sortedString($string);
        return $this->signWithRSA($sortedString);
    }

    public function buildString($request)
    {
        ksort($request);
        $stringApplet = '';
        foreach ($request as $key => $values) {
            if (in_array($key, $this->excludeFields)) {
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

        return $stringApplet;
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
        try {
            $rsa = PublicKeyLoader::loadPrivateKey(file_get_contents(storage_path('app/keys/private.pem')));
            $signtureByte = $rsa->sign($data);

            return base64_encode($signtureByte);
        } catch (\Exception $e) {
            \Log::error('Error loading private key: ' . $e->getMessage());
            return null;
        }
    }
}
