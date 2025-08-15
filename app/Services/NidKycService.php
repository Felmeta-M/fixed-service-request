<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use SimpleXMLElement;
use Exception;

class NidKycService
{
    protected function formatResponse(bool $success, $data = null, $error = null)
    {
        return [
            'success' => $success,
            'data'    => $data,
            'error'   => $error,
        ];
    }

    public function requestData(array $payload)
    {
        try {
            $xml = $this->buildXml($payload);
            $response = Http::withHeaders([
                'Content-Type' => 'text/xml; charset=utf-8',
            ])->send('POST', config('services.kyc.endpoint'), [
                'body' => $xml,
            ]);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kyc request Failed'
                ], 500);
            }

            if ($response->successful()) {
                return $this->parseResponse($response->body());
            }
        } catch (Exception $e) {
            Log::error("NID OTP Request Error: " . $e->getMessage());
            return $this->formatResponse(false, null, $e->getMessage());
        }
    }

    public function buildXml(array $data)
    {
        $transactionId = Str::uuid();
        $processTime = now()->format('YmdHis');
        $requestTime = now()->format('YmdHis');
        $credentials = config('services.kyc');
        $otp_value = $this->encryptText($data['otp_value']);

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
   <soapenv:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
      <wsa:To>{$credentials['endpoint']}</wsa:To>
      <wsa:MessageID>urn:uuid:{$transactionId}</wsa:MessageID>
      <wsa:Action>GetDataKyc</wsa:Action>
   </soapenv:Header>
   <soapenv:Body>
      <nid:GetDataKycReqMsg xmlns:com="http://www.huawei.com/bss/soaif/interface/common/" xmlns:nid="http://www.huawei.com/bss/soaif/interface/NID/">
         <com:RequestHeader>
            <com:Version>{$credentials['version']}</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:SequenceId>1</com:SequenceId>
            <com:Channel>{$credentials['channel']}</com:Channel>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:AccessUser>{$credentials['access_user']}</com:AccessUser>
            <com:AccessPassword>{$credentials['access_password']}</com:AccessPassword>
            <com:OperatorId>{$credentials['operator_id']}</com:OperatorId>
         </com:RequestHeader>
         <nid:GetDataKycReqBody>
            <nid:id>{$credentials['client_id']}</nid:id>
            <nid:clientSecret>{$credentials['client_secret']}</nid:clientSecret>
            <nid:requestTime>{$requestTime}</nid:requestTime>
            <nid:env>{$credentials['env']}</nid:env>
            <nid:domainUri>{$credentials['domain_uri']}</nid:domainUri>
            <nid:transactionID>{$data['transaction_id']}</nid:transactionID>
            <nid:requestedAuth>
               <nid:otp>true</nid:otp>
               <nid:demo>false</nid:demo>
               <nid:bio>false</nid:bio>
            </nid:requestedAuth>
            <nid:consentObtained>true</nid:consentObtained>
            <nid:individualId>{$data['individual_id']}</nid:individualId>
            <nid:individualIdType>{$credentials['individual_id_type']}</nid:individualIdType>
            <nid:request>
               <nid:timestamp>{$requestTime}</nid:timestamp>
               <nid:otp>{$otp_value}</nid:otp>
            </nid:request>
         </nid:GetDataKycReqBody>
      </nid:GetDataKycReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    public function parseResponse(string $xmlResponse)
    {
        try {
            $xml = new SimpleXMLElement($xmlResponse);
            $namespaces = $xml->getNamespaces(true);

            // Navigate to RetCode & RetMsg
            $retCode = (string) $xml->children($namespaces['soapenv'])
                ->Body
                ->children($namespaces['nid'])
                ->GetDataKycRspMsg
                ->children($namespaces['com'])
                ->ResponseHeader
                ->RetCode;

            $retMsg = (string) $xml->children($namespaces['soapenv'])
                ->Body
                ->children($namespaces['nid'])
                ->GetDataKycRspMsg
                ->children($namespaces['com'])
                ->ResponseHeader
                ->RetMsg;

            return [
                'success' => $retCode === '0',
                'code' => $retCode,
                'message' => $retMsg,
                'raw' => $xmlResponse,
            ];
        } catch (Exception $e) {
            Log::error("XML Parsing Error: {$e->getMessage()}");
            return [
                'success' => false,
                'error' => 'Invalid XML format',
            ];
        }
    }

    function encryptText(string $plainText): string
    {
        $key = config('services.national_id_secret_key');

        // Ensure key is exactly 16 bytes for AES-128
        if (strlen($key) !== 16) {
            throw new \Exception('Encryption key must be exactly 16 characters for AES-128.');
        }

        // Generate a random IV (AES-128-CBC uses 16 bytes IV)
        $iv = random_bytes(openssl_cipher_iv_length('AES-128-CBC'));

        // Encrypt
        $encrypted = openssl_encrypt($plainText, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);

        // Return Base64 of IV + encrypted data
        return base64_encode($iv . $encrypted);
    }
}
