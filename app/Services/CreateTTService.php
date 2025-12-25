<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\TroubleTicket;
use App\Services\ApiResponse;
use App\Services\BaseApiService;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class CreateTTService extends BaseApiService
{
    protected int $timeout = 15;
    protected int $rateLimit = 50;

    public function __construct(protected readonly GetCombiningService $get_combining_service) {}

    protected function endpoint(): string
    {
        return config('services.tt.endpoint');
    }

    public function createTT(array $data)
    {
        try {
            $data['trouble_title'] = "Fixed Services Provisioning System Complaint";
            $xmlPayload  = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            // Log::info($xmlResponse);
            $parsed = $this->parseResponseXml($xmlResponse, $data);
            return $parsed;
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::exception($e, 'Create TT failed.');
        }
    }

    public function getSubscriber(array $responseData): array
    {
        if (empty($responseData['success']) || $responseData['success'] !== true) {
            throw new \RuntimeException('API call failed: ' . ($responseData['message'] ?? 'Unknown error'));
        }

        $subscriber = data_get($responseData, 'data');
        // Log::info($subscriber);

        if (empty($subscriber)) {
            throw new \RuntimeException('Subscriber not found in API response.');
        }

        return $subscriber;
    }


    protected function buildRequestXml(array $data): string
    {
        $response = $this->get_combining_service->getByServiceNumber($data['access_number']);
        $responseData = $response->getData(true);
        $subscriber = $this->getSubscriber($responseData);
        //   "customer": {
        //     "customer_id": "10101229445550",
        //     "customer_code": "828278100",
        //     "first_name": "ww",
        //     "nationality": "1000",
        //     "customer_type": "2",
        //     "customer_level": "7",
        //     "customer_language": "2002",
        //     "gender": "1",
        //     "status": "A02"
        // },

        //    "customer": {
        //     "customer_id": "10101229445550",
        //     "customer_code": "828278100",
        //     "first_name": "ww",
        //     "nationality": "1000",
        //     "customer_type": "2",
        //     "customer_level": "7",
        //     "customer_language": "2002",
        //     "gender": "1",
        //     "status": "A02"
        // },

        //  "account": {
        //     "account_id": "10111229497658",
        //     "account_code": "628534010"
        // },

        //  "ext_params": {
        //     "CustomerName": "ww",
        //     "BranchName": "www",
        //     "CustomerCategory": "10",
        //     "CustSubCategory": "24",
        //     "TelecomRegionId": " "
        // },

        //    "addresses": [
        //     {
        //         "address_class": "1",
        //         "contact_seq": "1000000391549601",
        //         "address_type": "3",
        //         "local_id": "0001",
        //         "address1": "1409645498",
        //         "address2": "7",
        //         "address3": "65",
        //         "address4": "637",
        //         "address5": "grtf",
        //         "address6": "544544",
        //         "address9": "ww",
        //         "address11": ""
        //     }
        // ],

        // $customer = Customer::current();
        // API	DB	GUI
        // Address1	CUST_REGION	ethio Zone/Region
        // Address2	CUST_CITY	Administrative Region/City
        // Address3	CUST_ZONE	Sub city/Zone
        // Address4	CUST_TOWN	Wereda/Town
        // Address5		Kebele
        // Address6		House No
        // Address7		Street Name
        // Address8		Apartment
        // Address9		Building Name/Special Name

        $defaults = [
            'requestor' => 1,
            'title' => $subscriber?->title ?? 'Mr.',
            'first_name' => $subscriber['customer']['first_name'],
            'middle_name' => "",
            'last_name' => $subscriber['customer']['first_name'],

            'customer_type' => $subscriber['customer']['customer_type'],
            'customer_level' => $subscriber['customer']['customer_level'],
            'customer_category' => $subscriber['ext_params']['CustomerCategory'],
            'cust_sub_category' => $subscriber['ext_params']['CustSubCategory'],

            'cust_id' => $subscriber['customer']['customer_id'],
            'subs_id' => $subscriber['subscriber']['subscriber_id'],

            'admin_region' => $subscriber['addresses'][0]['address1'],
            'zone' => $subscriber['addresses'][0]['address3'],
            'city' => $subscriber['addresses'][0]['address2'],
            'sub_city' => $subscriber['addresses'][0]['address4'],
            'wereda' => $subscriber['addresses'][0]['address4'],
            'kebele' => $subscriber['addresses'][0]['address5'],

            'street' => $subscriber['addresses'][0]['address6'],
            'house_no' => $subscriber['addresses'][0]['address6'],
            'building_name' => $subscriber['addresses'][0]['address9'],
            'floor' => $subscriber['addresses'][0]['address6'],
            'room_no' => $subscriber['addresses'][0]['address6'],

            'access_number' => '',
            'account_number' => $subscriber['account']['account_id'],

            'contact_person' => '',
            'mobile_no' => '',

            'trouble_title' => '',
            'trouble_reason' => '',
            'accept_time' => date('YmdHis'),
            'occurrence_date' => date('YmdHis'),

            'expect_feedback_time' => '?',
            'fault_location' => '?',

            'send_sms' => 'Yes',
            'tt_description' => "",
        ];

        $data = array_merge($defaults, $data);

        return <<<XML
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
    /**
     * Parse SOAP response for createTT API
     *
     * @param string $xml
     * @param bool $throwOnFailure Whether to throw exception if TT creation fails
     * @return array
     * @throws RuntimeException
     */
    public function parseResponseXml(string $xml, array $payload)
    {
        $customer = Customer::current();

        libxml_use_internal_errors(true);

        $parsed = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);

        $namespaces = $parsed->getNamespaces(true);
        $parsed->registerXPathNamespace('soapenv', $namespaces['soapenv'] ?? '');
        $parsed->registerXPathNamespace('ns1', $namespaces['ns1'] ?? '');

        $responseNodes = $parsed->xpath('//soapenv:Body/ns1:createTTResponse');
        if (empty($responseNodes)) {
            throw new RuntimeException('Invalid SOAP response: createTTResponse node missing.');
        }

        $response = $responseNodes[0];

        $resultCode   = (string) ($response->resultCode ?? '');
        $description  = (string) ($response->desc ?? '');
        $ttSerialNo   = (string) ($response->ttSerialNo ?? '');

        $success = $resultCode === '0';

        /**
         * ❗ DO NOT persist if TT creation failed
         */
        if (!$success || empty($ttSerialNo) || $ttSerialNo === '-1') {
            return ApiResponse::error($description ?: 'TT creation failed.', 422);
        }

        /**
         * ❗ Ensure customer is authenticated / resolved
         */
        // if (!$customer || empty($customer?->code)) {
        //     throw new RuntimeException('Customer context missing for TT creation.');
        // }

        /**
         * ✅ Create or update ticket safely
         */
        $ticket = TroubleTicket::updateOrCreate(
            ['tt_serial_no' => $ttSerialNo],
            [
                'customer_code'  => $customer?->code ?? '828300808', //TODO: default value
                'access_number'  => $payload['access_number'],
                'contact_person' => $payload['contact_person'],
                'mobile_no'      => $payload['mobile_no'],
                'trouble_title'  => $payload['trouble_title'],
                'trouble_reason' => $payload['trouble_reason'],
                'tt_description' => $payload['tt_description'],
                'status'         => 'in_progress',
            ]
        );

        return ApiResponse::success([
            'success'       => true,
            'message'       => $description,
            'tt_serial_no'  => $ttSerialNo,
            'ticket_id'     => $ticket->id,
        ]);
    }
}
