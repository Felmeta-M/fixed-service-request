<?php

namespace App\Helpers;

class TelebirrHelper
{
    public static function createMerchantOrderId(): string
    {
        return (string)floor(microtime(true) * 1000);
    }

    public static function createTimeStamp(): string
    {
        return (string) time();
    }

    public static function createNonceStr(): string
    {
        $chars = [
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
            "H",
            "I",
            "J",
            "K",
            "L",
            "M",
            "N",
            "O",
            "P",
            "Q",
            "R",
            "S",
            "T",
            "U",
            "V",
            "W",
            "X",
            "Y",
            "Z",
        ];
        $str = "";
        for ($i = 0; $i < 32; $i++) {
            $index = intval(rand() * 35);
            $str .= $chars[$i];
        }
        return uniqid();
    }
}
