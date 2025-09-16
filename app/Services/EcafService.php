<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Http\UploadedFile;

class EcafService extends BaseApiService
{
    protected int $timeout = 20;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.ecaf.endpoint');
    }

    public function uploadFile(array $data)
    {
        try {
            $xmlPayload = $this->buildXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedXml = $this->parseResponse($xmlResponse);
            return ApiResponse::success($parsedXml);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::exception($e, 'Ecaf upload failed.');
        }
    }

    private function buildXml(array $data): string
    {
        $transactionId = uniqid();
        $credentials = config('services.ecaf');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ecaf="http://ecaf4kiosk.ecaf.inpsur.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <ecaf:UploadFile>
         <captureDetails>
            <API_USERNAME>{$credentials['api_username']}</API_USERNAME>
            <API_PASSWORD>{$credentials['api_password']}</API_PASSWORD>
            <AGENT_USERNAME>{$credentials['agent_username']}</AGENT_USERNAME>
            <TRANSACTION_ID>{$transactionId}</TRANSACTION_ID>
            <CHANNEL_ID>{$credentials['channel_id']}</CHANNEL_ID>
            <CUST_TYPE>{$credentials['cust_type']}</CUST_TYPE>
            <CUST_CODE>{$data['cust_code']}</CUST_CODE>
            <CUST_FIRST_NAME>{$data['first_name']}</CUST_FIRST_NAME>
            <CUST_OTHER_NAME>{$data['other_name']}</CUST_OTHER_NAME>
            <CUST_LAST_NAME>{$data['last_name']}</CUST_LAST_NAME>
            <CALENDAR_TYPE>{$credentials['calendar_type']}</CALENDAR_TYPE>
            <ID_EXPIRY_DATE>{$credentials['id_expiry_date']}</ID_EXPIRY_DATE>
            <DOOR_TO_DOOR>false</DOOR_TO_DOOR>
            <DELEGATE>{$credentials['delegate']}</DELEGATE>
            <FUNCTION>{$credentials['function']}</FUNCTION>
            <CORRECTION/>
            <ImageData>
                <Image>
                    <ImageType>0</ImageType>
                    <Content>{$data['photo']}</Content>
                    <ImageName>{$transactionId}</ImageName>
                </Image>
            </ImageData>
         </captureDetails>
      </ecaf:UploadFile>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    private function parseResponse(string $xml)
    {
        try {
            // Load XML
            $xmlObject = simplexml_load_string($xml);

            if ($xmlObject === false) {
                return ApiResponse::error("Invalid XML response");
            }

            // Get namespaces
            $namespaces = $xmlObject->getNamespaces(true);

            // Navigate to SOAP Body
            $body = $xmlObject->children($namespaces['soap'])->Body;

            // Access UploadFileResponse (ns2 namespace)
            $response = $body->children($namespaces['ns2'])->UploadFileResponse;

            // Get <return> node
            $return = $response->return;

            // Extract values
            $errorCode = (string) $return->errorCode;
            $errorMessage = (string) $return->errorMessage;
            $rejectedCount = (int) $return->rejectedCount;

            // Check for errors
            // if ($errorCode !== '0') {
            //     return ApiResponse::error($errorMessage, 500, [
            //         'errorCode' => $errorCode,
            //         'rejectedCount' => $rejectedCount,
            //     ]);
            // }

            // Success response
            return ApiResponse::success([
                'errorCode' => $errorCode,
                'errorMessage' => $errorMessage,
                'rejectedCount' => $rejectedCount,
            ]);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to parse SOAP response: ' . $e->getMessage());
        }
    }

    public function imageToBase64(UploadedFile $file): string
    {
        if ($file instanceof UploadedFile) {
            $path = $file->getRealPath();
        } elseif (is_string($file) && file_exists($file)) {
            $path = $file;
        } else {
            throw new \Exception("Invalid file input or file not found.");
        }

        $type = pathinfo($path, PATHINFO_EXTENSION);
        $content = file_get_contents($path);

        if ($content === false) {
            throw new \Exception("Unable to read file: {$path}");
        }

        return 'data:image/png;base64,' . base64_encode($content);
    }
}
