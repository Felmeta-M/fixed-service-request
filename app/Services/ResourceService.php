<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class ResourceService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 100;

    protected function endpoint(): string
    {
        return config('services.check_resource.endpoint');
    }

    public function check(array $data)
    {
        try {
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            // Log::info($xmlResponse);
            $parsedXml = $this->parseResponseXml($xmlResponse, $data);
            return ApiResponse::success($parsedXml);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::exception($e, 'Resource check failed.');
        }
    }

    protected function buildRequestXml(array $data): string
    {
        $transactionId = uniqid();
        $processTime   = now()->format('YmdHis');
        $credentials   = config('services.check_resource');

        $customer = Customer::current();

        $defaults = [
            'prod_spec_code' => 'C_P_UFBI_E',
            'number_line'    => '1',
            'acc_nbr'        => '-1',
            'event_code'     => '101',
            'radius'         => '200',
            'combo_flag'     => '0',

            'cust_id'        => $customer?->code,
            'cust_name'      => $customer->name,
            'cust_addr' => $customer->address_string,

        ];

        $data = array_merge($defaults, $data);

        $custAddr = htmlspecialchars($data['cust_addr'], ENT_XML1 | ENT_QUOTES, 'UTF-8');
        $custName = htmlspecialchars($data['cust_name'], ENT_XML1 | ENT_QUOTES, 'UTF-8');

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
    <soapenv:Header>
        <typ:AuthenticationInfo xmlns:typ="http://oss.zsmart.ztesoft.com/om/webservice/types/">
            <UserName>{$credentials['access_user']}</UserName>
            <Password>{$credentials['access_pwd']}</Password>
            <TransactionId>{$transactionId}</TransactionId>
        </typ:AuthenticationInfo>
    </soapenv:Header>
    <soapenv:Body>
        <typ:resourceCheck xmlns:typ="http://oss.zsmart.ztesoft.com/om/webservice/types/">
            <PROD_SPEC_CODE>{$data['prod_spec_code']}</PROD_SPEC_CODE>
            <NUMBER_LINE>{$data['number_line']}</NUMBER_LINE>
            <ACC_NBR>{$data['acc_nbr']}</ACC_NBR>
            <EVENT_CODE>{$data['event_code']}</EVENT_CODE>
            <CUST_ID>{$data['cust_id']}</CUST_ID>
            <CUST_NAME>{$custName}</CUST_NAME>
            <CUST_ADDR>{$custAddr}</CUST_ADDR>
            <LONGITUDE>{$data['longitude']}</LONGITUDE>
            <LATITUDE>{$data['latitude']}</LATITUDE>
            <STAFF_CODE>{$credentials['staff_code']}</STAFF_CODE>
            <STAFF_NAME>{$credentials['staff_name']}</STAFF_NAME>
            <COMBO_FLAG>{$data['combo_flag']}</COMBO_FLAG>
            <TIMESTAMP>{$processTime}</TIMESTAMP>
            <BANDWIDTH>{$data['bandwidth']}</BANDWIDTH>
            <RADIUS>{$data['radius']}</RADIUS>
        </typ:resourceCheck>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }



    private function parseResponseXml(string $xml, array $data)
    {
        libxml_use_internal_errors(true);
        $parsed = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        // Step 2: Get namespaces
        $namespaces = $parsed->getNamespaces(true);
        // \Log::info('Namespaces found', $namespaces);

        // Step 3: Register namespaces for XPath
        $parsed->registerXPathNamespace('soapenv', $namespaces['soapenv'] ?? '');
        $parsed->registerXPathNamespace('ns1', $namespaces['ns1'] ?? '');

        // Step 4: Trace the SOAP Body
        $bodyNodes = $parsed->xpath('//soapenv:Body');
        if (empty($bodyNodes)) {
            \Log::error('SOAP Body not found');
            throw new \Exception('SOAP Body not found');
        }
        // $soapBody = $bodyNodes[0];
        // \Log::info('SOAP Body found', ['children' => array_keys((array)$soapBody)]);

        // Step 5: Trace ResourceCheckResponse
        $responses = $parsed->xpath('//soapenv:Body/ns1:ResourceCheckResponse');
        if (empty($responses)) {
            \Log::error('ResourceCheckResponse not found');
            throw new \Exception('ResourceCheckResponse not found');
        }
        $response = $responses[0];
        // \Log::info('ResourceCheckResponse found', ['children' => array_keys((array)$response)]);
        // Step 6: Trace each RESOURCE element
        $resources = [];
        if (isset($response->RESOURCE_LIST->RESOURCE)) {
            foreach ($response->RESOURCE_LIST->RESOURCE as $i => $res) {
                // \Log::info("RESOURCE #{$i}", ['xml' => $res->asXML()]);
                $resources[] = [
                    'distance' => (string)$res->DISTANCE,
                    'ava_port' => (string)$res->AVAPORT,
                    'neid' => (string)$res->NEID,
                    'nename' => (string)$res->NENAME, //vendor 
                    'typeid' => (string)$res->TYPEID,
                    'longitude' => (string)$data['longitude'],
                    'latitude' => (string)$data['latitude'],
                    'cable_type' => (string)$res->CABLETYPE,
                    'cable_type_desc' => (string)$res->CABLETYPEDESC,
                ];
            }
        } else {
            \Log::warning('No RESOURCE elements found in RESOURCE_LIST');
        }

        // Step 7: Log final parsed info
        // \Log::info('Number of resources parsed', $resources);
        $shortestResource =  $this->getShortestResource($resources);
        // Store latest shortest resource in session
        // session(['latest_resource' => $shortestResource]);
        return $shortestResource;
    }

    public function getShortestResource(array $resources): ?array
    {
        try {
            $resource = collect($resources)
                ->sortBy(fn($r) => $r['distance'])
                ->first();

            if (!$resource) {
                return null;
            }

            // Encrypt sensitive fields
            $resource['distance'] = Crypt::encryptString((string)$resource['distance']);
            $resource['cable_type'] = Crypt::encryptString((string)$resource['cable_type']);
            $resource['longitude'] = Crypt::encryptString((string)$resource['longitude']);
            $resource['latitude'] = Crypt::encryptString((string)$resource['latitude']);


            return $resource;
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Failed to process resource: ' . $e->getMessage());
            return null; // Or throw custom exception if needed
        }
    }
}
