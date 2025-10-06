<?php

namespace App\Services;

class ResourceService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.check_resource.endpoint');
    }

    public function check(array $data)
    {
        try {
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedXml = $this->parseResponseXml($xmlResponse);
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
        $credentials = config('services.check_resource');

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
           <PROD_SPEC_CODE>{$data['PROD_SPEC_CODE']}</PROD_SPEC_CODE>
            <NUMBER_LINE>{$data['NUMBER_LINE']}</NUMBER_LINE>
            <ACC_NBR>{$data['ACC_NBR']}</ACC_NBR>
            <EVENT_CODE>{$data['EVENT_CODE']}</EVENT_CODE>
            <CUST_ID>{$data['CUST_ID']}</CUST_ID>
            <CUST_NAME>{$data['CUST_NAME']}</CUST_NAME>
            <CUST_ADDR>{$data['CUST_ADDR']}</CUST_ADDR>
            <LONGITUDE>{$data['LONGITUDE']}</LONGITUDE>
            <LATITUDE>{$data['LATITUDE']}</LATITUDE>
            <STAFF_CODE>{$data['STAFF_CODE']}</STAFF_CODE>
            <STAFF_NAME>{$data['STAFF_NAME']}</STAFF_NAME>
            <COMBO_FLAG>{$data['COMBO_FLAG']}</COMBO_FLAG>
            <TIMESTAMP>{$processTime}</TIMESTAMP>
            <BANDWIDTH>{$data['BANDWIDTH']}</BANDWIDTH>
            <RADIUS>{$data['RADIUS']}</RADIUS>
        </typ:resourceCheck>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponseXml(string $xml)
    {
        $parsed = simplexml_load_string($xml);

        if ($parsed === false) {
            return [];
        }

        $namespaces = $parsed->getNamespaces(true);

        $resources = [];
        $list = $parsed->children($namespaces['soapenv'])
            ->Body
            ->children($namespaces['ns1'])
            ->RESOURCE_LIST
            ->RESOURCE ?? [];

        foreach ($list as $res) {
            $resources[] = [
                'distance'        => (string) ($res->DISTANCE ?? ''),
                'ava_port'        => (string) ($res->AVAPORT ?? ''),
                'ne_id'           => (string) ($res->NEID ?? ''),
                'type_id'         => (string) ($res->TYPEID ?? ''),
                'longitude'       => (string) ($res->LONGITUDE ?? ''),
                'latitude'        => (string) ($res->LATITUDE ?? ''),
                'ne_name'         => (string) ($res->NENAME ?? ''),
                'cable_type'      => (string) ($res->CABLETYPE ?? ''),
                'cable_type_desc' => (string) ($res->CABLETYPEDESC ?? ''),
            ];
        }

        return $this->getShortestResource($resources);
    }

    public function getShortestResource(array $resources): ?array
    {
        if (empty($resources)) {
            return null;
        }

        return collect($resources)
            ->sortBy(fn($r) => $r['distance'])
            ->first();
    }
}
