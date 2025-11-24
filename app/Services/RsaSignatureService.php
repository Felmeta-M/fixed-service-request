<?php

namespace App\Services;


use phpseclib3\Crypt\RSA;
use phpseclib3\Crypt\PublicKeyLoader;
use Illuminate\Support\Facades\Log;

class RsaSignatureService
{
    public static function createOrder($trade_code = '', $amount = '')
    {
        $config = config('services.telebirr');

        if (empty($trade_code) || empty($amount)) {
            Log::error('Invalid order parameters', ['trade_code' => $trade_code, 'amount' => $amount]);
            throw new \InvalidArgumentException('Trade code and amount cannot be empty');
        }
        // Log the trade code and amount before processing
        Log::info('Creating order', ['trade_code' => $trade_code, 'amount' => $amount]);

        $result = json_decode(self::applyFabricToken());
        \Log::info("apply token", [$result]);

        if (isset($result->error)) {
            Log::error('Failed to retrieve fabric token', ['error' => $result->error]);
            throw new \RuntimeException('Token retrieval failed');
        }

        $fabricToken = $result->token;
        Log::info('Fabric token retrieved', ['fabric_token' => $fabricToken]);
        $createOrderResult = self::requestCreateOrder($fabricToken, $trade_code, $amount);
        $prepayId = json_decode($createOrderResult)->biz_content->prepay_id;
        $rawRequest =  self::createRawRequest($prepayId);
        $rawRequest = $config['web_base_url'] . $rawRequest . "&version=1.0&trade_type=Checkout";

        return trim((string)$rawRequest);
    }



    /**
     * @Purpose: Requests CreateOrder
     *
     * @Param: fabricToken|String trade_code|string amount|string
     * @Return: String | Boolean
     */

    public static function requestCreateOrder($fabricToken, $trade_code, $amount)
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway' . '/payment/v1/merchant/preOrder');
        curl_setopt($ch, CURLOPT_POST, 1);
        \Log::info($fabricToken);
        $headers = ['Content-Type: application/json', 'X-APP-Key:REDACTED_APP_KEY', 'Authorization:' . $fabricToken];
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $payload = self::createRequestObject($trade_code, $amount);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

        $server_output = curl_exec($ch);

        // Check for cURL errors
        if (curl_errno($ch)) {
            $error_msg = curl_error($ch);
            curl_close($ch);
            Log::error("cURL error: $error_msg");
            return response()->json([
                'message' => 'Failed to create order',
                'success' => false,
                'error' => $error_msg,
            ]);
        }

        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            Log::error("HTTP error: $httpCode with response: $server_output");
            return response()->json([
                'message' => 'Failed to create order',
                'success' => false,
                'response' => json_decode($server_output),
            ]);
        }

        return $server_output;
    }



    /**
     * @Purpose: Creating Request Object
     *
     * @Param: trade_code|String and amount|String
     * @Return: Json encoded string
     */
    public static function createRequestObject($trade_code, $amount)
    {
        $merchangOrderId = (string) self::createMerchantOrderId();
        // $telebirrOrder =  TelebirrOrder::where('invoice_no', $trade_code)->update(['merch_order_id' => $merchangOrderId]);
        //\Log::info($payment);

        $req = [
            'nonce_str' => (string) self::createNonceStr(),
            'method' => 'payment.preorder',
            'timestamp' => (string) self::createTimeStamp(),
            'version' => '1.0',
            'biz_content' => [],
        ];

        $biz = [
            'notify_url' => route('telebirr.notify'),
            'business_type' => 'BuyGoods',
            'trade_type' => 'Checkout',
            'appid' => 'REDACTED_MERCHANT_APP_ID',
            'merch_code' => 'REDACTED_MERCHANT_CODE',
            'merch_order_id' => $merchangOrderId,
            'title' => (string) $trade_code,
            'total_amount' => (string) $amount,
            'trans_currency' => 'ETB',
            'timeout_express' => '120m',
            'payee_identifier' => 'REDACTED_MERCHANT_CODE',
            'payee_identifier_type' => '04',
            'payee_type' => '5000',
            'redirect_url' => route('home')

        ];

        $req['biz_content'] = $biz;
        $req['sign_type'] = 'SHA256WithRSA';

        $req['sign'] = self::sign($req);

        return json_encode($req);
    }



    /**
     * @Purpose: Create a rawRequest string for H5 page to start pay
     *
     * @Param: prepayId returned from the createRequestObject
     * @Return: rawRequest|string
     */
    public static function createRawRequest($prepayId)
    {
        $maps = [
            'appid' => 'REDACTED_MERCHANT_APP_ID',
            'merch_code' => 'REDACTED_MERCHANT_CODE',
            'nonce_str' => self::createNonceStr(),
            'prepay_id' => $prepayId,
            'timestamp' => self::createTimeStamp(),
            'sign_type' => 'SHA256WithRSA',
        ];
        $rawRequest = '';
        foreach ($maps as $map => $m) {
            $rawRequest .= $map . '=' . $m . "&";
        }
        $sign = static::sign($maps);
        // order by ascii in array
        $rawRequest = $rawRequest . 'sign=' . $sign;

        return $rawRequest;
    }
    /**
     * @Purpose: Apply fabric token generated by et-server
     *
     * @Param: no parameters needed it takes the fabricAppId and the appSecrete from the constructor of class ApplyFabricToken
     * @Return: authToken
     */

    public static function applyFabricToken()
    {
        $config = config('services.telebirr');
        $ch = curl_init();
        $headers = ['Content-Type: application/json', 'X-APP-Key:REDACTED_APP_KEY'];
        curl_setopt($ch, CURLOPT_URL, $config['base_url'] . '/payment/v1/token');
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_HEADER, 0);

        $payload = ['appSecret' => 'REDACTED_SECRET'];
        $data = json_encode($payload);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        //curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        //curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $authToken = curl_exec($ch);

        if ($authToken === false) {
            $error = curl_error($ch);
            Log::error("Token retrieval failed: $error");
            curl_close($ch);
            return response()->json(['message' => 'Token retrieval failed', 'error' => $error]);
        }

        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($httpCode !== 200) {
            $response = json_decode($authToken);
            Log::error("Token retrieval failed with HTTP code $httpCode: ", (array) $response);
            curl_close($ch);
            return response()->json(['message' => 'Token retrieval failed', 'response' => $response]);
        }

        curl_close($ch);

        return $authToken;
    }


    public static function sign($request)
    {
        $exclude_fields = ['sign', 'sign_type', 'header', 'refund_info', 'openType', 'raw_request'];
        $data = $request;
        ksort($data);
        $stringApplet = '';
        foreach ($data as $key => $values) {
            if (in_array($key, $exclude_fields)) {
                continue;
            }
            if ($key == 'biz_content') {
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

        return self::SignWithRSA(self::sortedString($stringApplet));
    }


    /**
     * @Purpose: sorting string
     *
     * @Param: stringApplet|string
     * @Return:
     */
    public static function sortedString($stringApplet)
    {
        $stringExplode = '';
        $sortedArray = explode('&', $stringApplet);
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
    /**
     * @Purpose: Generate RSA signature of data
     *
     * @Param: $data - the sign message in array format
     * @Return: base64 encoded sign signed with sha256
     */
    public static function SignWithRSA($data)
    {
        $rsa = PublicKeyLoader::loadPrivateKey(file_get_contents(storage_path('app/keys/private.pem')));

        $signtureByte = $rsa->sign($data);

        return base64_encode($signtureByte);
    }


    public static function createMerchantOrderId()
    {
        return (string) time();
    }


    public static function createTimeStamp()
    {
        return (string) time();
    }

    /**
     * @Purpose: Generate a 32 length of random string
     *
     * @Param: no-Parameter is required.
     * @Return: A random string with length of 32..
     */
    public static function createNonceStr()
    {
        $length = 32;
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        return $randomString;
    }
}
