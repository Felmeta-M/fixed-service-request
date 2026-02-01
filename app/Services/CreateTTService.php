<?php

namespace App\Services;

use App\Models\TroubleTicket;
use App\Models\TroubleTicketReason;
use App\Services\ApiResponse;
use App\Services\BaseApiService;
use App\Services\Logging\AppLogger;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class CreateTTService extends BaseApiService
{
    protected int $timeout = 30;
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
     * 1. Validate access_number is provided
     * 2. Check session for cached customer data (from lookupServiceNumber)
     * 3. If cached and valid, use it (avoids double API call)
     * 4. If not cached, fallback to API call
     * 5. Build XML and create TT
     * 6. Clear session cache on success
     */
    public function createTT(array $data)
    {
        try {
            // Step 1: Validate access_number is provided
            if (empty($data['access_number'])) {
                return ApiResponse::error('Service number (access_number) is required', 400);
            }

            $accessNumber = $data['access_number'];
            $sessionKey = "tt_lookup_{$accessNumber}";

            // Step 2: Check for cached session data (from lookupServiceNumber)
            $cachedData = session()->get($sessionKey);
            $customerData = null;

            if ($cachedData && isset($cachedData['data']) && isset($cachedData['expires_at'])) {
                // Validate cache hasn't expired
                if ($cachedData['expires_at'] > now()->timestamp) {
                    $customerData = $cachedData['data'];
                    AppLogger::api()->info('CreateTT: Using cached session data', [
                        'access_number' => $accessNumber,
                        'cached_at' => date('Y-m-d H:i:s', $cachedData['cached_at']),
                    ]);
                } else {
                    // Cache expired, clear it
                    session()->forget($sessionKey);
                    AppLogger::api()->info('CreateTT: Session cache expired, will fetch fresh data', [
                        'access_number' => $accessNumber,
                    ]);
                }
            }

            // Step 3: If no valid cache, fallback to API call
            if (!$customerData) {
                AppLogger::api()->info('CreateTT: No cache found, calling GetCombiningService', [
                    'access_number' => $accessNumber,
                ]);

                $combiningResponse = $this->get_combining_service->getByServiceNumber($accessNumber);
                $customerResult = $combiningResponse->getData(true);

                if (!($customerResult['success'] ?? false)) {
                    $rawMessage = $customerResult['message'] ?? '';

                    // Distinguish between API failures vs "not found" scenarios
                    $isApiFailure = str_contains($rawMessage, 'API request')
                        || str_contains($rawMessage, 'timed out')
                        || str_contains($rawMessage, 'failed');

                    if ($isApiFailure) {
                        // Server/network error - suggest retry
                        $message = 'Unable to verify service number due to a temporary issue. Please try again.';
                        $statusCode = 503; // Service Unavailable
                        AppLogger::api()->warning('CreateTT: API call failed (server issue)', [
                            'access_number' => $accessNumber,
                            'raw_message' => $rawMessage,
                        ]);
                    } else {
                        // Actual not found or validation error
                        $message = $rawMessage ?: 'Service number not found. Please verify the number and try again.';
                        $statusCode = 404;
                        AppLogger::api()->warning('CreateTT: Service number not found', [
                            'access_number' => $accessNumber,
                            'message' => $message,
                        ]);
                    }

                    return ApiResponse::error($message, $statusCode);
                }

                $customerData = $customerResult['data'] ?? [];
            }

            // Step 4: Store queried customer data for XML building and persistence
            $data['queried_customer'] = $customerData;

            // Use tt_description as trouble_title to minimize customer journey
            $data['trouble_title'] = $data['tt_description'] ?? $data['trouble_reason'];

            // Step 5: Build XML with queried customer data (no additional API call)
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsed = $this->parseResponseXml($xmlResponse, $data);

            // Step 6: Clear session cache on successful TT creation
            $parsedData = $parsed->getData(true);
            if (($parsedData['success'] ?? false) && !empty($parsedData['data']['tt_serial_no'])) {
                session()->forget($sessionKey);
                AppLogger::api()->info('CreateTT: Session cache cleared after successful TT creation', [
                    'access_number' => $accessNumber,
                    'tt_serial_no' => $parsedData['data']['tt_serial_no'],
                ]);
            }

            return $parsed;
        } catch (RuntimeException $e) {
            AppLogger::api()->error('CreateTT: Runtime error', [
                'error' => $e->getMessage(),
                'access_number' => $data['access_number'] ?? null,
            ]);
            return ApiResponse::safeError($e, 'Failed to create trouble ticket. Please try again.');
        } catch (\Throwable $e) {
            AppLogger::api()->error('CreateTT: Exception', [
                'error' => $e->getMessage(),
                'access_number' => $data['access_number'] ?? null,
            ]);
            return ApiResponse::safeError($e, 'Failed to create trouble ticket. Please try again.');
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
     * Uses cached data from session - NO additional API call
     */
    protected function buildRequestXml(array $data): string
    {
        // Use cached customer data from createTT (already fetched from session or API)
        $subscriber = $data['queried_customer'] ?? [];

        if (empty($subscriber)) {
            throw new RuntimeException('No customer data available for XML building');
        }

        // Extract queried customer data
        $customer = $subscriber['customer'] ?? [];
        $addresses = $subscriber['addresses'][0] ?? [];
        $extParams = $subscriber['ext_params'] ?? [];

        // Customer profile from queried data
        $customerId = $customer['customer_id'] ?? '';
        $customerCode = $customer['customer_code'] ?? "";
        $subscriberId = $subscriber['subscriber']['subscriber_id'] ?? '';
        // Use trouble_reason_label as title if provided (e.g., "Bill Problem/Balance Lost")
        // Falls back to customer title or default
        $title = $data['trouble_reason_label'] ?? $customer['title'] ?? 'Service Issue';

        // Get customer name - API may return name in ExtParams.CustomerName instead of FirstName
        $customerNameFromExt = $extParams['CustomerName'] ?? '';
        if (!empty($customerNameFromExt) && empty($customer['first_name'])) {
            // Parse name from ExtParams (e.g., "test carry" -> first="test", last="carry")
            $nameParts = explode(' ', $customerNameFromExt, 3);
            $firstName = $nameParts[0] ?? 'Customer';
            $middleName = $nameParts[1] ?? 'customer';
            $lastName = $nameParts[2] ?? ($nameParts[1] ?? 'customer');
        } else {
            $firstName = $customer['first_name'] ?? 'customer';
            $middleName = $customer['middle_name'] ?? 'customer';
            $lastName = $customer['last_name'] ?? 'customer';
        }
        $name = trim("{$firstName} {$middleName} {$lastName}") ?: 'Customer';

        // BSS Classification from queried data
        $customerType = $customer['customer_type'] ?? '1';
        $customerLevel = $customer['customer_level'] ?? '8';
        // Get category from ExtParams if not in customer object
        $customerCategory = $customer['customer_category'] ?? ($extParams['CustomerCategory'] ?? '1');
        $custSubCategory = $customer['customer_subcategory'] ?? ($extParams['CustSubCategory'] ?? '1');

        // Address from queried data (Address1=Region, Address2=City, Address3=Zone, Address4=Wereda, Address5=Kebele, Address6=HouseNo)
        $ethioZone = !empty($extParams['address1']) ? $extParams['address1'] : '21';
        $adminRegion = !empty($addresses['address2']) ? $addresses['address2'] : '5'; //Todo: change to region_id
        $zone = !empty($addresses['address3']) ? $addresses['address3'] : 'aa';
        $city = !empty($addresses['address2']) ? $addresses['address2'] : $zone;
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

        // Look up trouble reason path from ID (frontend sends reason ID as value)
        $troubleReasonId = $data['trouble_reason'];
        $troubleReasonRecord = TroubleTicketReason::find($troubleReasonId);
        $troubleReason = $troubleReasonRecord?->reason_path ?? $troubleReasonId;

        // Store the looked-up reason_path for later use in parseResponseXml
        $data['trouble_reason_path'] = $troubleReason;

        // Third-party requires ttDescription to be non-empty
        // Fall back to trouble_reason_label or title if description is empty
        $ttDescription = !empty($data['tt_description']) 
            ? $data['tt_description'] 
            : ($data['trouble_reason_label'] ?? $title ?? 'Service issue reported');

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
         <adminRegion>5</adminRegion>
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
         <additionalFaultyNbr></additionalFaultyNbr>
         <contactPerson>{$contactPerson}</contactPerson>
         <mobileNo>{$mobileNo}</mobileNo>
    
         <troubleTitle>{$troubleTitle}</troubleTitle>
         <troubleReason>{$troubleReason}</troubleReason>
         <acceptTime>{$acceptTime}</acceptTime>
         <occurrenceDate>{$occurrenceDate}</occurrenceDate>
         <!--Optional:-->
         <expectFeedbackTime>{$expectFeedbackTime}</expectFeedbackTime>
         <!--Optional:-->
         <faultLocation></faultLocation>
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
        $account = $queriedCustomer['account'] ?? [];
        $addresses = $queriedCustomer['addresses'][0] ?? [];
        $extParams = $queriedCustomer['ext_params'] ?? [];

        // Determine customer_code for local DB:
        // - If logged in: use logged-in user's customer_code
        // - If anonymous: use account_code from API response (service number's account)
        $loggedInUserCode = $this->customerCode();
        $serviceAccountCode = $account['account_code'] ?? ($customer['customer_code'] ?? '');

        // Use logged-in user code if available, otherwise use service account code
        $creatorCode = !empty($loggedInUserCode) ? $loggedInUserCode : $serviceAccountCode;

        // Service owner info (actual owner of the service number from API query)
        $serviceOwnerCode = $customer['customer_code'] ?? '';

        // Get service owner name from ExtParams if not in customer object
        $customerNameFromExt = $extParams['CustomerName'] ?? '';
        if (!empty($customerNameFromExt) && empty($customer['first_name'])) {
            $serviceOwnerName = $customerNameFromExt;
        } else {
            $serviceOwnerName = trim(($customer['first_name'] ?? '') . ' ' . ($customer['middle_name'] ?? '') . ' ' . ($customer['last_name'] ?? ''));
        }

        // Create or update ticket with full details for frontend display
        $ticket = TroubleTicket::updateOrCreate(
            ['tt_serial_no' => $ttSerialNo],
            [
                // Who created the TT:
                // - Logged-in user: their customer_code
                // - Anonymous user: service number's account_code
                'customer_code' => $creatorCode,

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
                'trouble_title' => $payload['trouble_reason_label'] ?? $payload['trouble_title'] ?? '',
                'trouble_reason' => $payload['trouble_reason_path'] ?? $payload['trouble_reason'],
                'tt_description' => $payload['tt_description'],
                'status' => 'open',
            ]
        );

        AppLogger::business()->info('TT created successfully', [
            'tt_serial_no' => $ttSerialNo,
            'service_number' => $payload['access_number'],
            'service_owner_code' => $serviceOwnerCode,
            'created_by' => $creatorCode,
            'is_logged_in' => !empty($loggedInUserCode),
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
