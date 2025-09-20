<?php

namespace App\Services;

use phpseclib3\Crypt\PublicKeyLoader;

class TelebirrSignerService
{
    protected string $privateKey;
    protected array $excludeFields;

    public function __construct()
    {
        $this->privateKey = file_get_contents(config('telebirr.private_key_path'));
        $this->excludeFields = config('telebirr.exclude_fields');
    }

    public function sign(array $request): string
    {
        $string = $this->buildString($request);
        $sortedString = $this->sortedString($string);
        return $this->signWithRSA($sortedString);
    }

    protected function buildString(array $request): string
    {
        ksort($request);

        $pairs = [];
        foreach ($request as $key => $value) {
            if (in_array($key, $this->excludeFields, true)) {
                continue;
            }

            if ($key === 'biz_content' && is_array($value)) {
                foreach ($value as $k => $v) {
                    $pairs[] = "{$k}={$v}";
                }
            } else {
                $pairs[] = "{$key}={$value}";
            }
        }

        return implode('&', $pairs);
    }

    protected function sortedString(string $string): string
    {
        $arr = explode('&', $string);
        sort($arr);
        return implode('&', $arr);
    }

    protected function signWithRSA(string $data): string
    {
        $key = PublicKeyLoader::load($this->privateKey)
            ->withHash('sha256')
            ->withMGFHash('sha256');

        $signature = $key->sign($data);

        return base64_encode($signature);
    }
}
