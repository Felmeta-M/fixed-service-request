<?php

namespace App\Services;

class ResourceCheckService extends BaseApiService
{
    protected int $timeout = 20;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.check_resource.endpoint');
    }

    public function send(array $data)
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
        $transactionId = now()->format('YmdHis') . rand(10000, 99999);
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
            <PROD_SPEC_CODE>{$data['prod_spec_code']}</PROD_SPEC_CODE>
            <NUMBER_LINE>{$data['number_line']}</NUMBER_LINE>
            <EVENT_CODE>{$data['event_code']}</EVENT_CODE>
            <CUST_ID>{$data['cust_id']}</CUST_ID>
            <CUST_NAME>{$data['cust_name']}</CUST_NAME>
            <LONGITUDE>{$data['longitude']}</LONGITUDE>
            <LATITUDE>{$data['latitude']}</LATITUDE>
            <STAFF_CODE>{$data['staff_code']}</STAFF_CODE>
            <STAFF_NAME>{$data['staff_name']}</STAFF_NAME>
            <COMBO_FLAG>{$data['combo_flag']}</COMBO_FLAG>
            <TIMESTAMP>{$data['timestamp']}</TIMESTAMP>
            <CUST_ADDR>{$data['cust_addr']}</CUST_ADDR>
        </typ:resourceCheck>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponseXml(string $xml)
    {
        $body = simplexml_load_string($xml, null, 0, "http://schemas.xmlsoap.org/soap/envelope/");
        $body->registerXPathNamespace('ns1', 'http://oss.zsmart.ztesoft.com/om/webservice/types/');

        $resources = [];
        foreach ($body->xpath('//ns1:RESOURCE_LIST/ns1:RESOURCE') as $res) {
            $resources[] = [
                'distance' => (string)$res->DISTANCE,
                'ava_port' => (string)$res->AVAPORT,
                'ne_id' => (string)$res->NEID,
                'type_id' => (string)$res->TYPEID,
                'longitude' => (string)$res->LONGITUDE,
                'latitude' => (string)$res->LATITUDE,
                'ne_name' => (string)$res->NENAME,
                'cable_type' => (string)$res->CABLETYPE,
                'cable_type_desc' => (string)$res->CABLETYPEDESC,
            ];
        }

        return ApiResponse::success($resources);
    }
}
