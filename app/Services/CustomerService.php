<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Zone;
use App\Services\Logging\AppLogger;
use App\Support\CustomerContext;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class CustomerService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 30;
    protected string $transactionId;

    public function createCustomer(array $data)
    {
        try {
            // $zoneId = CustomerContext::code() ?? $data['zone'] ?? $data['address']['zone'] ?? null;
            // if (!$zoneId) {
            //     throw new RuntimeException('Zone is required to create a customer profile.');
            // }
            $data['ethio_zone_or_region'] = '25'; // $this->getZoneCodeById($zoneId);
            $xmlPayload = $this->buildXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);

            $parsedXml = $this->parseResponse($xmlResponse, $data);
            return ApiResponse::success($parsedXml);
        } catch (RuntimeException $e) {
            AppLogger::api()->error('Customer create failed', [
                'error' => $e->getMessage(),
            ]);
            return ApiResponse::safeError($e, 'Customer registration failed. Please try again.');
        } catch (Throwable $e) {
            AppLogger::api()->error('Customer create exception', [
                'error' => $e->getMessage(),
            ]);
            return ApiResponse::safeError($e, 'Customer registration failed. Please try again.');
        }
    }

    protected function buildXml(array $data = []): string
    {
        $customer = $this->getLocalCustomerDataOptimized();

        // Ensure phone_number is always set (request may send contact.mobile_no only)
        $data['phone_number'] = $data['phone_number'] ?? $data['contact']['mobile_no'] ?? $customer?->phone_number ?? null;
        $newPhone = $data['phone_number'];
        $existingValid = $customer?->phone_number && preg_match('/^(\+251|251|0)?(7)\d{8}$/', $customer?->phone_number);
        if ($newPhone && $newPhone !== $customer?->phone_number && $existingValid) {
            $data['phone_number'] = $newPhone;
        } else {
            $data['phone_number'] = $customer?->phone_number ?? $newPhone;
        }

        $credentials = config('services.ng');

        $this->transactionId = uniqid();

        $processTime = now()->format('YmdHis');

        // ============================================================
        // BACKEND-ONLY VALUES - Always set by backend, NOT from frontend
        // These are fixed for third-party API and local database
        // ============================================================
        $data['customer_type'] = '1';           // Residential (fixed)
        $data['customer_category'] = '1';       // Category 1 (fixed)
        $data['customer_subcategory'] = '1';    // Subcategory 1 (fixed)
        $data['customer_level'] = '7';          // level 7 Copper (fixed)

        // ============================================================
        // OPTIONAL FIELDS WITH DEFAULTS - Frontend can override these
        // ============================================================
        $data['title'] = $data['title'] ?? '1';                           // Default: Mr.
        $data['nationality'] = $data['nationality'] ?? '1231';            // Default: Ethiopian
        $data['identification_type'] = $data['identification_type'] ?? '2'; // Default: National ID
        $data['primary_language'] = $data['primary_language'] ?? '2060';  // Default: Amharic
        $data['income'] = '6';                         // Default: Income level 6
        $data['place_of_birth'] = $data['place_of_birth'] ?? '';          // Default: Empty

        $data['occupation'] = '36';                  // 36 other
        $data['education'] = '5';                   // 7 Bachelor's Degree
        $data['religion'] = '3';                    // 3 other

        // Contact defaults
        $data['contact'] = $data['contact'] ?? [];
        $data['contact']['notification_mode'] = $data['contact']['notification_mode'] ?? '1'; // Default: SMS
        $data['contact']['home_no'] = $data['contact']['home_no'] ?? '';
        $data['contact']['office_no'] = $data['contact']['office_no'] ?? '';
        $data['contact']['fax_no'] = $data['contact']['fax_no'] ?? '';

        // $data['identification_number'] = random_int(100000, 999999); //TODO: remove this after testing

        // Safely handle optional contact person info (may be empty array from frontend)
        $contactPerson = $data['contact_person'][0] ?? null;
        $contactPersonXml = '';

        if ($contactPerson) {
            $cpFirstName = $contactPerson['first_name'] ?? '';
            $cpMiddleName = $contactPerson['middle_name'] ?? '';
            $cpLastName = $contactPerson['last_name'] ?? '';
            $cpTitle = $contactPerson['title'] ?? '';
            $cpHomeNo = $contactPerson['home_no'] ?? '';
            $cpOfficeNo = $contactPerson['office_no'] ?? '';
            $cpMobileNo = $contactPerson['mobile_no'] ?? '';
            $cpFaxNo = $contactPerson['fax_no'] ?? '';

            $contactPersonXml = "
                    <com:CustomerContactPersonInfoList>
                        <com:ContactPersonInfo>
                            <com:FirstName>{$cpFirstName}</com:FirstName>
                            <com:MiddleName>{$cpMiddleName}</com:MiddleName>
                            <com:LastName>{$cpLastName}</com:LastName>
                            <com:Title>{$cpTitle}</com:Title>
                            <com:HomeNo>{$cpHomeNo}</com:HomeNo>
                            <com:OfficeNo>{$cpOfficeNo}</com:OfficeNo>
                            <com:MobileNo>{$cpMobileNo}</com:MobileNo>
                            <com:FaxNo>{$cpFaxNo}</com:FaxNo>
                        </com:ContactPersonInfo>
                    </com:CustomerContactPersonInfoList>";
        }

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://oss.huawei.com/webservice/bss/services"
                  xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
    <soapenv:Header/>
    <soapenv:Body>
        <ser:CreateNewCustomerReqMsg>
            <ser:RequestHeader>
                <com:Version>1</com:Version>
                <com:TransactionId>{$this->transactionId}</com:TransactionId>
                <com:ProcessTime>{$processTime}</com:ProcessTime>
                <com:ChannelId>{$credentials['channel_id']}</com:ChannelId>
                <com:TechnicalChannelId>{$credentials['technical_channel_id']}</com:TechnicalChannelId>
                <com:AccessUser>{$credentials['access_user']}</com:AccessUser>
                <com:AccessPwd>{$credentials['access_pwd']}</com:AccessPwd>
            </ser:RequestHeader>

            <ser:CreateNewCustomerReqBody>
                <com:CustomerInfo>
                    <com:CustomerType>{$data['customer_type']}</com:CustomerType>
                    <com:CustomerCategory>{$data['customer_category']}</com:CustomerCategory>
                    <com:CustomerSubcategory>{$data['customer_subcategory']}</com:CustomerSubcategory>
                    <com:CustomerLevel>{$data['customer_level']}</com:CustomerLevel>
                    <com:FirstName>{$data['first_name']}</com:FirstName>
                    <com:MiddleName>{$data['middle_name']}</com:MiddleName>
                    <com:LastName>{$data['last_name']}</com:LastName>
                    <com:Title>{$data['title']}</com:Title>
                    <com:Nationality>{$data['nationality']}</com:Nationality>
                    <com:IdentificationType>{$data['identification_type']}</com:IdentificationType>
                    <com:IdentificationNumber>{$data['identification_number']}</com:IdentificationNumber>
                    <com:Gender>{$data['gender']}</com:Gender>
                    <com:DateofBirth>{$data['date_of_birth']}</com:DateofBirth>
                    <com:PlaceofBirth>{$data['place_of_birth']}</com:PlaceofBirth>
                    
                    <com:Occupation>{$data['occupation']}</com:Occupation>
                    <com:Education>{$data['education']}</com:Education>
                    <com:Religion>{$data['religion']}</com:Religion>
                    <com:Income>{$data['income']}</com:Income>
                    
                    <com:PrimaryLanguage>{$data['primary_language']}</com:PrimaryLanguage>

                    <com:CustomerAddressInfo>
                        <com:EthioZoneOrRegion>{$data['ethio_zone_or_region']}</com:EthioZoneOrRegion>
                        <com:AdministrativeRegionOrCity>{$data['address']['region']}</com:AdministrativeRegionOrCity>
                        <com:SubcityOrZone>{$data['address']['zone']}</com:SubcityOrZone>
                        <com:WeredaOrTown>{$data['address']['woreda']}</com:WeredaOrTown>
                        <com:Kebele>{$data['address']['kebele']}</com:Kebele>
                        <com:HouseNo>{$data['address']['house_no']}</com:HouseNo>
                    </com:CustomerAddressInfo>

                    <com:CustomerContactInfo>
                        <com:NotificationMode>{$data['contact']['notification_mode']}</com:NotificationMode>
                        <com:Email>{$data['contact']['email']}</com:Email>
                        <com:HomeNo>{$data['contact']['home_no']}</com:HomeNo>
                        <com:OfficeNo>{$data['contact']['office_no']}</com:OfficeNo>
                        <com:MobileNo>{$data['contact']['mobile_no']}</com:MobileNo>
                        <com:FaxNo>{$data['contact']['fax_no']}</com:FaxNo>
                    </com:CustomerContactInfo>
                    {$contactPersonXml}
                </com:CustomerInfo>
            </ser:CreateNewCustomerReqBody>
        </ser:CreateNewCustomerReqMsg>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    public function parseResponse(string $xml, array $data)
    {
        $xmlObject = simplexml_load_string($xml);

        $namespaces = $xmlObject->getNamespaces(true);
        $body = $xmlObject->children($namespaces['soapenv'])->Body;

        $response = $body->children($namespaces['ser'])->CreateNewCustomerRspMsg;

        $header = $response->children($namespaces['ser'])->ResponseHeader;
        $headerData = $header->children($namespaces['com']);

        $bodyData = $response->children($namespaces['ser'])->CreateNewCustomerRespBody;
        $customerData = $bodyData->children($namespaces['com']);
        $retCode = (string) $headerData->RetCode;
        $retMsg = (string) $headerData->RetMsg;

        // CRM returns "existing customer" when National ID already registered; extract customer code and sync local DB
        $existingCustomerCode = $this->extractCustomerCodeFromExistingCustomerMessage($retCode, $retMsg);
        if ($existingCustomerCode !== null) {
            $this->syncLocalCustomerWithCode($existingCustomerCode, $data, null);
            AppLogger::business()->info('Customer profile created', [
                'customer_code' => $existingCustomerCode,
                'transaction_id' => $this->transactionId,
            ]);
            return ApiResponse::success([
                'response_time' => (string) ($headerData->ResponseTime ?? ''),
                'ret_code' => $retCode,
                'ret_msg' => $retMsg,
                'customer_id' => '',
                'customer_code' => $existingCustomerCode,
                'transaction_id' => $this->transactionId,
            ]);
        }

        if ($retCode !== '0') {
            return ApiResponse::error("Create customer profile failed: {$retMsg}");
        }

        $customerCode = (string) ($customerData->CustomerCode ?? '');

        $customerSubId = Auth::guard('api')->user()?->customer_sub_id;
        if (!$customerSubId) {
            throw new Exception("Authenticated OTP user not found.");
        }
        $this->syncLocalCustomerWithCode($customerCode, $data, $customerSubId);

        AppLogger::business()->info('Customer profile created', [
            'customer_code' => $customerCode,
            'transaction_id' => $this->transactionId,
        ]);

        return ApiResponse::success([
            'response_time' => (string) ($headerData->ResponseTime ?? ''),
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'customer_id' => (string) ($customerData->CustomerId ?? ''),
            'customer_code' => $customerCode,
            'transaction_id' => $this->transactionId,
        ]);
    }

    /**
     * CRM "existing customer" response: RetCode 1219999936, RetMsg contains "has the customer code [943202060]".
     * Returns extracted customer code or null if not this case.
     */
    protected function extractCustomerCodeFromExistingCustomerMessage(string $retCode, string $retMsg): ?string
    {
        if ($retCode !== '1219999936') {
            return null;
        }
        if (preg_match('/has the customer code \[([^\]]+)\]/', $retMsg, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    /**
     * Update local customers and otps tables with CRM customer code (new creation or existing-customer sync).
     */
    protected function syncLocalCustomerWithCode(string $customerCode, array $data, ?string $customerSubId = null): void
    {
        $customerSubId = $customerSubId ?? Auth::guard('api')->user()?->customer_sub_id;
        if (!$customerSubId) {
            throw new Exception("Authenticated OTP user not found.");
        }

        DB::transaction(function () use ($customerCode, $data, $customerSubId) {
            DB::table('customers')
                ->where('sub', $customerSubId)
                ->update([
                    'title' => $data['title'] ?? '1',
                    'code' => $customerCode,
                    'phone_number' => $data['phone_number'] ?? $data['contact']['mobile_no'] ?? null,
                    'contact' => json_encode($data['contact'] ?? []),
                    'contact_persons' => json_encode($data['contact_person'] ?? []),
                    'gender' => ($data['gender'] ?? 0) == 1 ? 'Male' : 'Female',
                    'nationality' => 'Ethiopian',
                    'identification_type' => $data['identification_type'] ?? '2',
                    'identification_number' => $data['identification_number'] ?? '',
                    'birthdate' => $data['date_of_birth'] ?? null,
                    'place_of_birth' => $data['place_of_birth'] ?? null,
                    'occupation' => $data['occupation'] ?? '24',
                    'education' => $data['education'] ?? '7',
                    'religion' => $data['religion'] ?? '3',
                    'income' => $data['income'] ?? '6',
                    'primary_language' => $data['primary_language'] ?? null,
                    'region' => $data['address']['region'] ?? null,
                    'city' => $data['address']['city'] ?? null,
                    'wereda' => $data['address']['woreda'] ?? null,
                    'zone' => $data['address']['zone'] ?? null,
                    'kebele' => $data['address']['kebele'] ?? null,
                    'house_no' => $data['address']['house_no'] ?? null,
                    'street_name' => $data['address']['street_name'] ?? null,
                    'apartment' => $data['address']['apartment'] ?? null,
                    'customer_type' => '1',
                    'customer_category' => '1',
                    'customer_subcategory' => '1',
                    'customer_level' => '7',
                    'notification_mode' => $data['contact']['notification_mode'] ?? '1',
                    'credit_class' => $data['credit_class'] ?? 'Excellent',
                    'verified_at' => now(),
                    'updated_at' => now(),
                ]);

            DB::table('otps')
                ->where('customer_sub_id', $customerSubId)
                ->update([
                    'customer_code' => $customerCode,
                    'updated_at' => now(),
                ]);
        });
    }

    /**
     * Get local customer data - optimized with Query Builder
     */
    public function getLocalCustomerData($customerSubId): ?Customer
    {
        try {
            // Use Query Builder for simple lookup
            $customerData = DB::table('customers')
                ->where('sub', $customerSubId)
                ->first();

            if (!$customerData) {
                AppLogger::auth()->debug('No local customer found', [
                    'customer_sub_id' => $customerSubId,
                ]);
                return null;
            }

            // Hydrate to model only if we need full model functionality
            return Customer::find($customerData->id);
        } catch (Exception $e) {
            AppLogger::auth()->error('Error getting local customer data', [
                'customer_sub_id' => $customerSubId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get current customer data optimized - Query Builder with selective columns
     */
    protected function getLocalCustomerDataOptimized(): ?object
    {
        $customerSubId = Auth::guard('api')->user()?->customer_sub_id;

        if (!$customerSubId) {
            return null;
        }

        return DB::table('customers')
            ->where('sub', $customerSubId)
            ->select([
                'id',
                'sub',
                'code',
                'name',
                'phone_number',
                'title',
                'gender',
                'nationality',
                'identification_type',
                'identification_number',
                'birthdate',
                'place_of_birth',
                'occupation',
                'education',
                'religion',
                'income',
                'primary_language',
                // Address
                'region',
                'city',
                'wereda',
                'zone',
                'kebele',
                'house_no',
                'street_name',
                'apartment',
                // BSS Classification
                'customer_type',
                'customer_category',
                'customer_subcategory',
                'customer_level',
                // Notification & Credit
                'notification_mode',
                'credit_class',
            ])
            ->first();
    }

    /**
     * Get zone_code from customer's selected zone.
     * Delegates to ZoneService - single source of truth.
     *
     * @param int|string $zoneId The zone ID selected by the customer
     * @return string Zone code
     * @throws \RuntimeException If zone or zone_code cannot be found
     */
    protected function getZoneCodeById(int|string $zoneId): string
    {
        $zoneCode = app(ZoneService::class)->getZoneCodeById($zoneId);

        if (!$zoneCode) {
            AppLogger::api()->error('Zone code not found for zone ID', [
                'zone_id' => $zoneId,
            ]);
            throw new \RuntimeException(
                'Unable to create customer: The selected zone is not found in our system. Please contact support or update your profile with a valid zone.'
            );
        }

        return $zoneCode;
    }

    protected function endpoint(): string
    {
        $endpoint = config('services.ng.endpoint');

        if (empty($endpoint)) {
            throw new RuntimeException(
                'NG_ENDPOINT is not configured. Please set NG_ENDPOINT in your .env file.'
            );
        }

        return $endpoint;
    }
}
