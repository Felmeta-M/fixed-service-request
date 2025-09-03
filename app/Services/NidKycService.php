<?php

namespace App\Services;

use App\Helpers\AesHelper;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use SimpleXMLElement;
use Exception;

class NidKycService
{
    public function __construct(protected readonly AesHelper $aesHelper) {}

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
            ])->withBody($xml, 'text/xml')->post(config('services.kyc.endpoint'));

            if ($response->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kyc request SOAP Failed'
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

        $otp_value = $this->aesHelper->encrypt($data['otp_value'], config('services.national_id_secret_key'));

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
               <nid:timestamp>{$data['timestamp']}</nid:timestamp>
               <nid:otp>{$otp_value}</nid:otp>
            </nid:request>
         </nid:GetDataKycReqBody>
      </nid:GetDataKycReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }


    public function parseResponse(string $xml): array
    {
        try {
            $xmlObject = simplexml_load_string($xml);

            if ($xmlObject === false) {
                return $this->formatResponse(false, null, "Invalid XML response");
            }

            // Root namespaces (soapenv is here)
            $rootNamespaces = $xmlObject->getNamespaces(true);
            if (!isset($rootNamespaces['soapenv'])) {
                return $this->formatResponse(false, null, "Missing SOAP namespace");
            }

            // Navigate into <soapenv:Body>
            $body = $xmlObject->children($rootNamespaces['soapenv'])->Body ?? null;
            if (!$body) {
                return $this->formatResponse(false, null, "SOAP Body not found");
            }

            // Body namespaces (nid + com are here)
            $bodyNamespaces = $body->getNamespaces(true);

            // Get the response wrapper <nid:GetDataKycRspMsg>
            $responseMsg = $body->children($bodyNamespaces['nid'])->GetDataKycRspMsg ?? null;
            if (!$responseMsg) {
                return $this->formatResponse(false, null, "GetDataKycRspMsg not found");
            }

            // --- Header ---
            $header = $responseMsg->children($bodyNamespaces['com'])->ResponseHeader ?? null;
            if (!$header) {
                return $this->formatResponse(false, null, "ResponseHeader not found");
            }

            // --- Body ---
            $rspBody = $responseMsg->children($bodyNamespaces['nid'])->GetDataKycRspBody ?? null;
            if (!$rspBody) {
                return $this->formatResponse(false, null, "GetDataKycRspBody not found");
            }

            $response = $rspBody->response ?? null;
            if (!$response) {
                return $this->formatResponse(false, null, "Response section not found");
            }

            $photo = $response->identity->photo ?? '';
            // $this->handlePhoto($photo);
            // ✅ Successful parse
            return $this->formatResponse(true, [
                'transaction_id' => (string) ($header->TransactionId ?? ''),
                'provider'       => (string) ($rspBody->id ?? ''),
                'response_time'  => (string) ($rspBody->responseTime ?? ''),
                'kyc_status'     => filter_var((string) ($response->kycStatus ?? ''), FILTER_VALIDATE_BOOLEAN),
                'auth_token'     => (string) ($response->authResponseToken ?? ''),
                'identity' => [
                    'name' => [
                        'eng' => (string) ($response->identity->name[0]->value ?? ''),
                        'amh' => (string) ($response->identity->name[1]->value ?? ''),
                    ],
                    'dob' => (string) ($response->identity->dob ?? ''),
                    'gender' => [
                        'eng' => (string) ($response->identity->gender[0]->value ?? ''),
                        'amh' => (string) ($response->identity->gender[1]->value ?? ''),
                    ],
                    'phone' => (string) ($response->identity->phoneNumber ?? ''),
                    'email' => (string) ($response->identity->emailId ?? ''),
                    'address' => [
                        'eng' => (string) ($response->identity->fullAddress[0]->value ?? ''),
                        'amh' => (string) ($response->identity->fullAddress[1]->value ?? ''),
                    ],
                    'nationality' => [
                        'eng' => (string) ($response->identity->nationality[0]->value ?? ''),
                        'amh' => (string) ($response->identity->nationality[1]->value ?? ''),
                    ],
                    'photo_base64' => (string) $photo,
                ],
            ]);
        } catch (\Throwable $e) {
            return $this->formatResponse(false, null, "Parse error: " . $e->getMessage());
        }
    }

    /**
     * Handle photo base64 and optional saving.
     */
    protected function handlePhoto($photoNode): array
    {
        $photoBase64 = (string) $photoNode;
        $photoUrl = null;

        if (!empty($photoBase64)) {
            try {
                $photoData = base64_decode($photoBase64);
                $fileName = 'kyc_photos/' . uniqid('photo_') . '.jpg';
                \Storage::disk('public')->put($fileName, $photoData);
                $photoUrl = \Storage::disk('public')->url($fileName);
            } catch (\Throwable $e) {
                $photoUrl = null;
            }
        }

        return [
            'base64' => $photoBase64,
            'url'    => $photoUrl,
        ];
    }
}
