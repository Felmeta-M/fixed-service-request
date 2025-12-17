<?php

namespace App\Services;

use App\Models\Customer;
use App\Services\ApiResponse;
use App\Services\BaseApiService;

use function Symfony\Component\Clock\now;

class CreateTTService extends BaseApiService
{
    protected int $timeout = 15;
    protected int $rateLimit = 50;

    protected function endpoint(): string
    {
        return config('services.tt.endpoint');
    }

    public function createTT(array $data)
    {
        try {
            $xmlPayload  = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);

            \Log::info('CreateTT SOAP Response', ['xml' => $xmlResponse]);

            $parsed = $this->parseResponseXml($xmlResponse);

            return ApiResponse::success($parsed);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::exception($e, 'Create TT failed.');
        }
    }

    protected function buildRequestXml(array $data): string
    {
        $customer = Customer::current();
        $name = explode(' ', $customer->name);

        $defaults = [
            'requestor' => 1,

            'title' => $customer->title ?? 'Mr.',
            'first_name' => $name[0],
            'middle_name' => $name[1] ?? "",
            'last_name' => $name[2] ?? "",

            'customer_type' => 2,
            'customer_level' => 9,
            'customer_category' => 'Ethio Employee',
            'cust_sub_category' => 'Active',

            'cust_id' => $customer->code,
            'subs_id' => '160133496943',

            'admin_region' => 'Addis Ababa',
            'zone' => 'ethio',
            'city' => 'Addis Ababa',
            'sub_city' => 'Addis ketema sub city',
            'wereda' => '09',
            'kebele' => '12',

            'street' => '?',
            'house_no' => 'g',
            'building_name' => '?',
            'floor' => '?',
            'room_no' => '?',

            'access_number' => '929585309',
            'account_number' => '717876357',

            'contact_person' => 'tigist',
            'mobile_no' => '0930004756',

            'trouble_title' => '',
            'trouble_reason' => '',
            'accept_time' => now(),
            'occurrence_date' => now(),

            'expect_feedback_time' => '?',
            'fault_location' => '?',

            'send_sms' => 'Yes',
            'tt_description' => "",
        ];

        $data = array_merge($defaults, $data);

        if (!empty($customer?->address)) {
            $data['admin_region'] = trim($customer->address['region'] ?? $data['admin_region']);
            $data['zone']         = trim($customer->address['zone'] ?? $data['zone']);
            $data['wereda']       = trim($customer->address['woreda'] ?? $data['wereda']);
        }

        $data['kebele'] = $customer->kebele;
        $data['house_no'] = $customer->house_no;

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope 
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:eth="http://www.example.org/EthioSPMInterfaceSheet/">

    <soapenv:Header/>

    <soapenv:Body>
        <eth:createTT>
            <requestor>{$data['requestor']}</requestor>
            <title>{$data['title']}</title>
            <firstName>{$data['first_name']}</firstName>
            <middleName>{$data['middle_name']}</middleName>
            <lastName>{$data['last_name']}</lastName>

            <customerType>{$data['customer_type']}</customerType>
            <customerLevel>{$data['customer_level']}</customerLevel>
            <customerCategory>{$data['customer_category']}</customerCategory>
            <custSubCategory>{$data['cust_sub_category']}</custSubCategory>

            <custID>{$data['cust_id']}</custID>
            <subsID>{$data['subs_id']}</subsID>

            <adminRegion>{$data['admin_region']}</adminRegion>
            <zone>{$data['zone']}</zone>
            <city>{$data['city']}</city>
            <subCity>{$data['sub_city']}</subCity>
            <wereda>{$data['wereda']}</wereda>
            <kebele>{$data['kebele']}</kebele>

            <street>{$data['street']}</street>
            <houseNo>{$data['house_no']}</houseNo>
            <buildingName>{$data['building_name']}</buildingName>
            <floor>{$data['floor']}</floor>
            <roomNo>{$data['room_no']}</roomNo>

            <accessNumber>{$data['access_number']}</accessNumber>
            <acctNumber>{$data['account_number']}</acctNumber>

            <contactPerson>{$data['contact_person']}</contactPerson>
            <mobileNo>{$data['mobile_no']}</mobileNo>

            <troubleTitle>{$data['trouble_title']}</troubleTitle>
            <troubleReason>{$data['trouble_reason']}</troubleReason>
            <acceptTime>{$data['accept_time']}</acceptTime>
            <occurrenceDate>{$data['occurrence_date']}</occurrenceDate>

            <expectFeedbackTime>{$data['expect_feedback_time']}</expectFeedbackTime>
            <faultLocation>{$data['fault_location']}</faultLocation>

            <sendSMS>{$data['send_sms']}</sendSMS>
            <ttDescription>{$data['tt_description']}</ttDescription>
        </eth:createTT>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponseXml(string $xml): array
    {
        libxml_use_internal_errors(true);

        $parsed = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        $namespaces = $parsed->getNamespaces(true);

        $parsed->registerXPathNamespace('soapenv', $namespaces['soapenv']);
        $parsed->registerXPathNamespace('ns1', $namespaces['ns1']);

        $response = $parsed->xpath('//soapenv:Body/ns1:createTTResponse')[0] ?? null;

        if (!$response) {
            throw new \RuntimeException('Invalid SOAP response');
        }

        return [
            'result_code' => (string) $response->resultCode,
            'description' => (string) $response->desc,
            'tt_serial_no' => (string) $response->ttSerialNo,
        ];
    }
}
