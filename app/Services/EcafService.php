<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

class EcafService extends BaseApiService
{
    protected int $timeout = 20;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.ecaf.endpoint');
    }

    public function uploadFile(array $data, array $images)
    {
        try {
            $xmlPayload = $this->buildXml($data, $images);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedXml = $this->parseResponse($xmlResponse);
            return ApiResponse::success($parsedXml);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::exception($e, 'Ecaf upload failed.');
        }
    }

    private function buildXml(array $data, array $images): string
    {
        $transactionId = uniqid();
        $imagesXml = '';
        foreach ($images as $image) {
            $imagesXml .= "
                <Image>
                    <ImageType>{$image['type']}</ImageType>
                    <Content>{$image['content']}</Content>
                </Image>";
        }

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ecaf="http://ecaf4kiosk.ecaf.inpsur.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <ecaf:UploadFile>
         <captureDetails>
            <API_USERNAME>{$data['api_username']}</API_USERNAME>
            <API_PASSWORD>{$data['api_password']}</API_PASSWORD>
            <AGENT_USERNAME>{$data['agent_username']}</AGENT_USERNAME>
            <TRANSACTION_ID>{$transactionId}</TRANSACTION_ID>
            <CHANNEL_ID>{$data['channel_id']}</CHANNEL_ID>
            <CUST_TYPE>{$data['cust_type']}</CUST_TYPE>
            <CUST_CODE>{$data['cust_code']}</CUST_CODE>
            <CUST_FIRST_NAME>{$data['first_name']}</CUST_FIRST_NAME>
            <CUST_OTHER_NAME>{$data['other_name']}</CUST_OTHER_NAME>
            <CUST_LAST_NAME>{$data['last_name']}</CUST_LAST_NAME>
            <CALENDAR_TYPE>{$data['calendar_type']}</CALENDAR_TYPE>
            <ID_EXPIRY_DATE>{$data['id_expiry_date']}</ID_EXPIRY_DATE>
            <DOOR_TO_DOOR>{$data['door_to_door']}</DOOR_TO_DOOR>
            <DELEGATE>{$data['delegate']}</DELEGATE>
            <FUNCTION>{$data['function']}</FUNCTION>
            <CORRECTION>{$data['correction']}</CORRECTION>
            <ImageData>
                {$imagesXml}
            </ImageData>
         </captureDetails>
      </ecaf:UploadFile>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    private function parseResponse(string $xml): array
    {
        $cleanXml = str_ireplace(['SOAP-ENV:', 'SOAP:'], '', $xml);

        try {
            $response = simplexml_load_string($cleanXml);
            $json     = json_encode($response);
            return json_decode($json, true);
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error'   => 'Invalid SOAP response',
                'raw'     => $xml,
            ];
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
