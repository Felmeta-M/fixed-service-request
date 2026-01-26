<?php

namespace App\Services;

use App\Models\EthioZone;
use App\Models\TelecomRegion;
use App\Models\TroubleTicket;
use App\Models\Zone;
use App\Services\ApiResponse;
use App\Services\BaseApiService;
use App\Support\CustomerContext;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class CreateTTService extends BaseApiService
{
    protected int $timeout = 15;
    protected int $rateLimit = 50;

    public function __construct(protected readonly GetCombiningService $get_combining_service)
    {
    }

    /**
     * Get area_id from logged user's zone.
     * Path: customer.zone → zones.zone_code → ethio_zones.name → telecom_regions.area_id
     */
    protected function getAdminRegionFromLoggedUser(): ?string
    {
        // Step 1: Get zone ID from logged user
        $zoneId = CustomerContext::zone();
        if (!$zoneId) {
            return null;
        }

        // Step 2: Get zone_code from zones table
        $zone = Zone::find($zoneId);
        if (!$zone?->zone_code) {
            return null;
        }

        // Step 3: Get ethio_zone name using zone_code
        $ethioZone = EthioZone::where('code', $zone->zone_code)
            ->where('status', true)
            ->first();
        if (!$ethioZone?->name) {
            return null;
        }

        // Step 4: Get area_id from telecom_regions using ethio_zone name
        $telecomRegion = TelecomRegion::where('zone', $ethioZone->name)
            ->where('status', true)
            ->first();

        return $telecomRegion?->area_id;
    }

    protected function endpoint(): string
    {
        return config('services.tt.endpoint');
    }

    public function createTT(array $data)
    {
        try {
            // Use tt_description as trouble_title to minimize customer journey
            // (frontend no longer needs to send trouble_title separately)
            $data['trouble_title'] = $data['tt_description'] ?? 'Fixed Services Complaint';

            $xmlPayload = $this->buildRequestXml($data);
            Log::info($xmlPayload);
            $xmlResponse = $this->executeRequest($xmlPayload);
            // Log::info($xmlResponse);
            $parsed = $this->parseResponseXml($xmlResponse, $data);
            return $parsed;
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::fromException($e, 'Create TT failed.');
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
        // Fetch subscriber data from API for the specific access number (for IDs and address)
        $response = $this->get_combining_service->getByServiceNumber($data['access_number']);
        $responseData = $response->getData(true);
        $subscriber = $this->getSubscriber($responseData);

        $data['customer_code'] = $this->customerCode($data['customer_code'] ?? null);
        // Get dynamic customer profile, address, and BSS classification from logged-in user
        // Same approach as DataSubscriptionService
        $profile = $this->getCustomerProfile();
        $address = $this->getCustomerAddress();
        $bss = $this->getBssClassification();

        // Customer name with default (same as DataSubscriptionService)
        $customerName = $profile['name'] ?? 'Customer';

        // Get admin region from logged user's zone
        // Path: customer.zone → zones.zone_code → ethio_zones.name → telecom_regions.area_id
        $adminRegion = $this->getAdminRegionFromLoggedUser();
        if (!$adminRegion) {
            throw new \RuntimeException('Unable to create trouble ticket: Zone information is missing from your profile. Please contact support.');
        }

        // Extract subscriber data for IDs and account only
        $custId = $data['customer_code'] ?? $subscriber['customer']['customer_id'] ?? '';
        $subsId = $data['access_number'] ?? $data['access_number'] ?? '';
        $accountNumber = $data['account_number'] ?? $subscriber['account']['account_id'] ?? '';

        // Frontend data
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
            <title>{$profile['title']}</title>
            <firstName>{$customerName}</firstName>
            <middleName></middleName>
            <lastName>{$customerName}</lastName>

            <customerType>{$bss['customer_type']}</customerType>
            <customerLevel>{$bss['customer_level']}</customerLevel>
            <customerCategory>{$bss['customer_category']}</customerCategory>
            <custSubCategory>{$bss['customer_subcategory']}</custSubCategory>

            <custID>{$custId}</custID>
            <subsID>{$subsId}</subsID>

            <adminRegion>{$adminRegion}</adminRegion>
            <zone>{$address['zone']}</zone>
            <city>{$address['zone']}</city>
            <subCity>{$address['zone']}</subCity>
            <wereda>{$address['wereda']}</wereda>
            <kebele>{$address['kebele']}</kebele>

            <street>{$address['house_no']}</street>
            <houseNo>{$address['house_no']}</houseNo>
            <buildingName>{$address['street_name']}</buildingName>
            <floor>{$address['apartment']}</floor>
            <roomNo>{$address['apartment']}</roomNo>

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
     *
     * @param string $xml
     * @param bool $throwOnFailure Whether to throw exception if TT creation fails
     * @return array
     * @throws RuntimeException
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

        /**
         * ❗ DO NOT persist if TT creation failed
         */
        if (!$success || empty($ttSerialNo) || $ttSerialNo === '-1') {
            return ApiResponse::error($description ?: 'TT creation failed.', 422);
        }

        /**
         * ✅ Create or update ticket safely
         */
        $ticket = TroubleTicket::updateOrCreate(
            ['tt_serial_no' => $ttSerialNo],
            [
                'customer_code' => $this->customerCode(),
                'access_number' => $payload['access_number'],
                'contact_person' => $payload['contact_person'],
                'mobile_no' => $payload['mobile_no'],
                'trouble_title' => $payload['trouble_title'],
                'trouble_reason' => $payload['trouble_reason'],
                'tt_description' => $payload['tt_description'],
                'status' => 'in_progress',
            ]
        );

        return ApiResponse::success([
            'success' => true,
            'message' => $description,
            'tt_serial_no' => $ttSerialNo,
            'ticket_id' => $ticket->id,
        ]);
    }
}
