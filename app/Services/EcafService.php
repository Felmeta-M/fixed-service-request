<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

class EcafService
{
    protected string $endpoint;

    public function __construct()
    {
        $this->endpoint = config('services.ecaf.endpoint');
    }

    public function uploadFile(array $data, array $images)
    {
        $data = array_merge(config('services.ecaf'), $data);

        $xml = $this->buildSoapRequest($data, $images);
        $response = Http::withHeaders([
            'Content-Type' => 'text/xml; charset=utf-8',
        ])->withBody($xml, 'text/xml')->post($this->endpoint);

        if ($response->failed()) {
            return response()->json([
                'success' => false,
                'message' => 'ecaf upload failed'
            ], 500);
        }
        if ($response->successful()) {
            return $this->parseResponse($response->body());
        }
    }

    private function buildSoapRequest(array $data, array $images): string
    {
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
            <TRANSACTION_ID>{$data['transaction_id']}</TRANSACTION_ID>
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

        $content = file_get_contents($path);

        if ($content === false) {
            throw new \Exception("Unable to read file: {$path}");
        }

        return base64_encode($content);
    }
}
