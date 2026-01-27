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
        protected readonly QueryCustomerForTTService $queryCustomerForTTService
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

            // Step 2: Query customer by service number
            $customerResult = $this->queryCustomerForTTService->query($data['access_number']);

            if (!($customerResult['success'] ?? false)) {
                $message = $customerResult['message'] ?? 'Service number not found. Please verify the number and try again.';
                AppLogger::api()->warning('CreateTT: Service number not found', [
                    'access_number' => $data['access_number'],
                    'message' => $message,
                ]);
                return ApiResponse::error($message, 404);
            }

            // Step 3: Store queried customer data for XML building
            $data['queried_customer'] = $customerResult;

            // Use tt_description as trouble_title to minimize customer journey
            $data['trouble_title'] = $data['tt_description'] ?? 'Fixed Services Complaint';

            // Step 4: Build XML with queried customer data
            $xmlPayload = $this->buildRequestXml($data);
            Log::info('CreateTT XML Payload', ['xml' => $xmlPayload]);

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

        // Extract queried customer data (from service number query)
        $queriedCustomer = $data['queried_customer'] ?? [];
        $customer = $queriedCustomer['customer'] ?? [];
        $addresses = $queriedCustomer['addresses'][0] ?? [];
        $extParams = $queriedCustomer['ext_params'] ?? [];

        // Customer profile from queried data
        $customerId = $customer['customer_id'] ?? '';
        $customerCode = $customer['customer_code'] ?? $data['customer_code'] ?? '';
        $title = $customer['title'] ?? '1';
        $firstName = $customer['first_name'] ?? 'Customer';
        $middleName = $customer['middle_name'] ?? '';
        $lastName = $customer['last_name'] ?? '';

        // BSS Classification from queried data
        $customerType = $customer['customer_type'] ?? '0';
        $customerLevel = $customer['customer_level'] ?? '2';
        $customerCategory = $extParams['Customer Category'] ?? '1';
        $custSubCategory = $extParams['Customer Sub-Category'] ?? '1';

        // Address from queried data (Address1=Region, Address2=City, Address3=Zone, Address4=Wereda, Address5=Kebele, Address6=HouseNo)
        $adminRegion = $addresses['address1'] ?? '';
        $zone = $addresses['address3'] ?? '';
        $city = $addresses['address2'] ?? $zone;
        $subCity = $zone;
        $wereda = $addresses['address4'] ?? '';
        $kebele = $addresses['address5'] ?? '';
        $houseNo = $addresses['address6'] ?? '';

        // IDs from subscriber data
        $custId = $customerId ?: ($subscriber['customer']['customer_id'] ?? '');
        $subsId = $data['access_number'];
        $accountNumber = $data['account_number'] ?? $subscriber['account']['account_id'] ?? '';

        // Frontend data (contact info for the TT)
        $accessNumber = $data['access_number'];
        $contactPerson = $data['contact_person'];
        $mobileNo = $data['mobile_no'];
        $troubleTitle = $data['trouble_title'] ?? $data['tt_description'] ?? 'Fixed Services Complaint';
        $troubleReason = $data['trouble_reason'];
        $ttDescription = $data['tt_description'] ?? '';

        // Timestamps
        $acceptTime = date('YmdHis');
        $occurrenceDate = date('YmdHis');

        return <<<XML
<soapenv:Envelope 
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:eth="http://www.example.org/EthioSPMInterfaceSheet/">

    <soapenv:Header/>

    <soapenv:Body>
        <eth:createTT>
            <requestor>1</requestor>
            <title>{$title}</title>
            <firstName>{$firstName}</firstName>
            <middleName>{$middleName}</middleName>
            <lastName>{$lastName}</lastName>

            <customerType>{$customerType}</customerType>
            <customerLevel>{$customerLevel}</customerLevel>
            <customerCategory>{$customerCategory}</customerCategory>
            <custSubCategory>{$custSubCategory}</custSubCategory>

            <custID>{$custId}</custID>
            <subsID>{$subsId}</subsID>

            <adminRegion>{$adminRegion}</adminRegion>
            <zone>{$zone}</zone>
            <city>{$city}</city>
            <subCity>{$subCity}</subCity>
            <wereda>{$wereda}</wereda>
            <kebele>{$kebele}</kebele>

            <street>{$houseNo}</street>
            <houseNo>{$houseNo}</houseNo>
            <buildingName></buildingName>
            <floor></floor>
            <roomNo></roomNo>

            <accessNumber>{$accessNumber}</accessNumber>
            <acctNumber>{$accountNumber}</acctNumber>

            <contactPerson>{$contactPerson}</contactPerson>
            <mobileNo>{$mobileNo}</mobileNo>

            <troubleTitle>{$troubleTitle}</troubleTitle>
            <troubleReason>{$troubleReason}</troubleReason>
            <acceptTime>{$acceptTime}</acceptTime>
            <occurrenceDate>{$occurrenceDate}</occurrenceDate>

            <expectFeedbackTime>?</expectFeedbackTime>
            <faultLocation>?</faultLocation>

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

        // customer_code = logged-in user who created TT
        // service_owner_* = actual owner of the service number (from query)
        $loggedInUserCode = $this->customerCode();
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
