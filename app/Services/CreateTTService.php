<?php

namespace App\Services;

use App\Models\TroubleTicket;
use App\Services\ApiResponse;
use App\Services\BaseApiService;
use App\Services\Logging\AppLogger;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class CreateTTService extends BaseApiService
{
    protected int $timeout = 15;
    protected int $rateLimit = 50;

    public function __construct(
        protected readonly GetCombiningService $get_combining_service,
    ) {
    }

    protected function endpoint(): string
    {
        return config('services.tt.endpoint');
    }

    /**
     * Create Trouble Ticket
     * 
     * Flow:
     * 1. Query customer by service number (access_number)
     * 2. If not found, return error
     * 3. Use queried customer data for TT creation (not logged-in user)
     * 4. Track who created the TT (logged-in user)
     */
    public function createTT(array $data)
    {
        try {
            // Step 1: Validate access_number is provided
            if (empty($data['access_number'])) {
                return ApiResponse::error('Service number (access_number) is required', 400);
            }

            // Step 2: Query customer/subscriber by service number using GetCombiningService
            $combiningResponse = $this->get_combining_service->getByServiceNumber($data['access_number']);
            $customerResult = $combiningResponse->getData(true);

            if (!($customerResult['success'] ?? false)) {
                $message = $customerResult['message'] ?? 'Service number not found. Please verify the number and try again.';
                AppLogger::api()->warning('CreateTT: Service number not found', [
                    'access_number' => $data['access_number'],
                    'message' => $message,
                ]);
                return ApiResponse::error($message, 404);
            }

            // Step 3: Store queried customer data (parsed GetCombining payload) for XML building and persistence
            $data['queried_customer'] = $customerResult['data'] ?? [];

            // Use tt_description as trouble_title to minimize customer journey
            $data['trouble_title'] = $data['tt_description'] ?? 'Fixed Services Complaint';

            // Step 4: Build XML with queried customer data
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsed = $this->parseResponseXml($xmlResponse, $data);

            return $parsed;
        } catch (RuntimeException $e) {
            AppLogger::api()->error('CreateTT: Runtime error', [
                'error' => $e->getMessage(),
                'access_number' => $data['access_number'] ?? null,
            ]);
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            AppLogger::api()->error('CreateTT: Exception', [
                'error' => $e->getMessage(),
                'access_number' => $data['access_number'] ?? null,
            ]);
            return ApiResponse::fromException($e, 'Create TT failed.');
        }
    }

    /**
     * Get subscriber data from combining service (for IDs and account)
     */
    public function getSubscriber(array $responseData): array
    {
        if (empty($responseData['success']) || $responseData['success'] !== true) {
            throw new RuntimeException('API call failed: ' . ($responseData['message'] ?? 'Unknown error'));
        }

        $subscriber = data_get($responseData, 'data');

        if (empty($subscriber)) {
            throw new RuntimeException('Service number query failed');
        }

        return $subscriber;
    }

    /**
     * Build XML request using QUERIED customer data (not logged-in user)
     */
    protected function buildRequestXml(array $data): string
    {
        // Get subscriber data from API for IDs and account
        $response = $this->get_combining_service->getByServiceNumber($data['access_number']);
        $responseData = $response->getData(true);
        $subscriber = $this->getSubscriber($responseData);
        Log::info('CreateTT Subscriber', context: ['subscriber' => $subscriber]);
        // Extract queried customer data (from service number query)
        $customer = $subscriber['customer'] ?? [];
        $addresses = $subscriber['addresses'][0] ?? [];
        $extParams = $subscriber['ext_params'] ?? [];

        // Customer profile from queried data
        $customerId = $customer['customer_id'] ?? '';
        $customerCode = $customer['customer_code'] ?? "";
        $subscriberId = $subscriber['subscriber']['subscriber_id'] ?? '';
        $title = $customer['title'] ?? '1';
        $firstName = $customer['first_name'] ?? 'Customer';
        $middleName = $customer['middle_name'] ?? 'customer';
        $lastName = $customer['last_name'] ?? 'customer';
        $name = $firstName . ' ' . $middleName . ' ' . $lastName;

        // BSS Classification from queried data
        $customerType = $customer['customer_type'] ?? '1';
        $customerLevel = $customer['customer_level'] ?? '8';
        $customerCategory = $customer['customer_category'] ?? '1';
        $custSubCategory = $customer['customer_subcategory'] ?? '1';

        // Address from queried data (Address1=Region, Address2=City, Address3=Zone, Address4=Wereda, Address5=Kebele, Address6=HouseNo)
        $ethioZone = $extParams['address1'] ?? '';
        $adminRegion = $addresses['address2'] ?? '';
        $zone = $addresses['address3'] ?? '';
        $city = $addresses['address2'] ?? $zone;
        $subCity = $zone;
        $wereda = !empty($addresses['address4']) ? $addresses['address4'] : 'new';
        $kebele = !empty($addresses['address5']) ? $addresses['address5'] : 'new';
        $street = !empty($addresses['address11']) ? $addresses['address11'] : 'new';
        $houseNo = !empty($addresses['address6']) ? $addresses['address6'] : 'new';
        $buildingName = !empty($addresses['address9']) ? $addresses['address9'] : 'new';
        $floor = !empty($addresses['address10']) ? $addresses['address10'] : 'new';
        $roomNo = !empty($addresses['address12']) ? $addresses['address12'] : 'new';

        // IDs from subscriber data
        $accountId = $subscriber['account']['account_id'] ?? '';
        $accountCode = $subscriber['account']['account_code'] ?? '';
        $data['customer_code'] = $customerCode ?? $accountId;

        // Frontend data (contact info for the TT)
        $accessNumber = $data['access_number'];
        $contactPerson = $data['contact_person'];
        $mobileNo = '0' . substr($data['mobile_no'], -9); // Add 0 prefix and take last 9 digits
        $troubleTitle = $name;
        $troubleReason = $data['trouble_reason'];
        $ttDescription = $data['tt_description'] ?? '';

        //faulty number
        $faultLocation = $data['fault_location'] ?? '';
        $expectFeedbackTime = $data['expect_feedback_time'] ?? '';

        // Timestamps
        $acceptTime = date('YmdHis');
        $occurrenceDate = date('YmdHis');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:eth="http://www.example.org/EthioSPMInterfaceSheet/">
   <soapenv:Header/>
   <soapenv:Body>
      <eth:createTT>
         <requestor>1</requestor>
         <!--Optional:-->
         <title>{$title}</title>
         <firstName>{$firstName}</firstName>
         <!--Optional:-->
         <middleName>{$middleName}</middleName>
         <lastName>{$lastName}</lastName>
         
         <customerType>{$customerType}</customerType>
         <customerLevel>{$customerLevel}</customerLevel>

         <customerCategory>{$customerCategory}</customerCategory>
         <custSubCategory>{$custSubCategory}</custSubCategory>

         <custID>{$customerId}</custID>
         <subsID>{$subscriberId}</subsID>
         <adminRegion>{$adminRegion}</adminRegion>
         <zone>{$zone}</zone>
         <city>{$city}</city>
         <subCity>{$subCity}</subCity>
         <wereda>{$wereda}</wereda>
         <kebele>{$kebele}</kebele>
         <!--Optional:-->
         <street>{$street}</street>
         <houseNo>{$houseNo}</houseNo>
         <!--Optional:-->
         <buildingName>{$buildingName}</buildingName>
         <!--Optional:-->
         <floor>{$floor}</floor>
         <!--Optional:-->
         <roomNo>{$roomNo}</roomNo>
         <accessNumber>{$accessNumber}</accessNumber>
         <acctNumber>{$accountCode}</acctNumber>
         <!--Optional:-->
<!--         <additionalFaultyNbr></additionalFaultyNbr>-->
         <contactPerson>{$contactPerson}</contactPerson>
         <mobileNo>{$mobileNo}</mobileNo>
    
         <troubleTitle>{$troubleTitle}</troubleTitle>
         <troubleReason>{$troubleReason}</troubleReason>
         <acceptTime>{$acceptTime}</acceptTime>
         <occurrenceDate>{$occurrenceDate}</occurrenceDate>
         <!--Optional:-->
         <expectFeedbackTime>{$expectFeedbackTime}</expectFeedbackTime>
         <!--Optional:-->
         <faultLocation>{$faultLocation}</faultLocation>
         <sendSMS>Yes</sendSMS>
         <ttDescription>{$ttDescription}</ttDescription>         
      </eth:createTT>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Parse SOAP response for createTT API
     */
    public function parseResponseXml(string $xml, array $payload)
    {
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

        $resultCode = (string) ($response->resultCode ?? '');
        $description = (string) ($response->desc ?? '');
        $ttSerialNo = (string) ($response->ttSerialNo ?? '');

        $success = $resultCode === '0';

        // DO NOT persist if TT creation failed
        if (!$success || empty($ttSerialNo) || $ttSerialNo === '-1') {
            return ApiResponse::error($description ?: 'TT creation failed.', 422);
        }

        // Extract queried customer data for persistence
        $queriedCustomer = $payload['queried_customer'] ?? [];
        $customer = $queriedCustomer['customer'] ?? [];
        $addresses = $queriedCustomer['addresses'][0] ?? [];
        $extParams = $queriedCustomer['ext_params'] ?? [];

        // customer_code = logged-in user who created TT (or 'GUEST' for unauthenticated)
        // service_owner_* = actual owner of the service number (from query)
        $loggedInUserCode = $this->customerCode() ?? $payload['customer_code'] ?? '';
        $serviceOwnerCode = $customer['customer_code'] ?? '';
        $serviceOwnerName = trim(($customer['first_name'] ?? '') . ' ' . ($customer['middle_name'] ?? '') . ' ' . ($customer['last_name'] ?? ''));

        // Create or update ticket with full details for frontend display
        $ticket = TroubleTicket::updateOrCreate(
            ['tt_serial_no' => $ttSerialNo],
            [
                // Who created the TT (logged-in user)
                'customer_code' => $loggedInUserCode,

                // Service owner info (from queried service number)
                'service_owner_code' => $serviceOwnerCode,
                'service_owner_name' => $serviceOwnerName,
                'service_owner_type' => $customer['customer_type'] ?? '',
                'service_owner_level' => $customer['customer_level'] ?? '',

                // Service location/address for TT detail display
                'region' => $addresses['address1'] ?? '',
                'zone' => $addresses['address3'] ?? '',
                'city' => $addresses['address2'] ?? '',
                'sub_city' => $addresses['address3'] ?? '',
                'wereda' => $addresses['address4'] ?? '',
                'kebele' => $addresses['address5'] ?? '',
                'house_no' => $addresses['address6'] ?? '',

                // TT details
                'access_number' => $payload['access_number'],
                'contact_person' => $payload['contact_person'],
                'mobile_no' => $payload['mobile_no'],
                'trouble_title' => $payload['trouble_title'],
                'trouble_reason' => $payload['trouble_reason'],
                'tt_description' => $payload['tt_description'],
                'status' => 'in_progress',
            ]
        );

        AppLogger::business()->info('TT created successfully', [
            'tt_serial_no' => $ttSerialNo,
            'service_number' => $payload['access_number'],
            'service_owner_code' => $serviceOwnerCode,
            'created_by' => $loggedInUserCode,
        ]);

        return ApiResponse::success([
            'success' => true,
            'message' => $description,
            'tt_serial_no' => $ttSerialNo,
            'ticket_id' => $ticket->id,
            'service_owner' => [
                'customer_code' => $serviceOwnerCode,
                'name' => $serviceOwnerName,
            ],
        ]);
    }
}
