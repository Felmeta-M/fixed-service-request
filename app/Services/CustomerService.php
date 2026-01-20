<?php

namespace App\Services;

use App\Models\Customer;
use App\Services\Logging\AppLogger;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class CustomerService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;
    protected string $transactionId;

    public function createCustomer(array $data)
    {
        try {
            $data['ethio_zone_or_region'] = '21'; //TODO: remove this after testing NAAZ
            $xmlPayload = $this->buildXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);

            AppLogger::api()->debug('Customer create response received', [
                'transaction_id' => $this->transactionId,
            ]);

            $parsedXml = $this->parseResponse($xmlResponse, $data);
            return ApiResponse::success($parsedXml);
        } catch (RuntimeException $e) {
            AppLogger::api()->error('Customer create failed', [
                'error' => $e->getMessage(),
            ]);
            return ApiResponse::error($e->getMessage(), 500);
        } catch (Throwable $e) {
            AppLogger::api()->error('Customer create exception', [
                'error' => $e->getMessage(),
            ]);
            return ApiResponse::fromException($e, 'Customer create failed.');
        }
    }

    protected function buildXml(array $data = []): string
    {
        $customer = $this->getLocalCustomerDataOptimized();

        $credentials = config('services.customer');

        $this->transactionId = uniqid();
        $processTime = now()->format('YmdHis');

        // Set default values for customer classification (used by third-party API)
        $data['customer_type'] = $data['customer_type'] ?? '1';           // Default: Residential
        $data['customer_category'] = $data['customer_category'] ?? '1';   // Default: Category 1
        $data['customer_subcategory'] = $data['customer_subcategory'] ?? '1'; // Default: Subcategory 1
        $data['customer_level'] = $data['customer_level'] ?? '1';         // Default: Level 1

        $data['identification_number'] = random_int(100000, 999999); //TODO: remove this after testing
        $data['income'] = $data['income'] ?? '6'; // Default income level

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
                <com:AccessPwd>{$credentials['access_password']}</com:AccessPwd>
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

        if ($retCode !== '0') {
            return ApiResponse::error("Create customer profile failed: {$retMsg}");
        }

        $customerCode = (string) $customerData->CustomerCode ?? '';

        // Use Query Builder for atomic updates - more efficient than Eloquent
        $customerSubId = Auth::guard('api')->user()?->customer_sub_id;

        if (!$customerSubId) {
            throw new Exception("Authenticated OTP user not found.");
        }

        DB::transaction(function () use ($customerCode, $data, $customerSubId) {
            // Batch update using Query Builder - single query each
            DB::table('customers')
                ->where('sub', $customerSubId)
                ->update([
                    'title' => $data['title'],
                    'code' => $customerCode,
                    'contact' => json_encode($data['contact']),
                    'contact_persons' => json_encode($data['contact_person']),
                    'gender' => $data['gender'],
                    'nationality' => $data['nationality'],
                    'identification_type' => $data['identification_type'],
                    'identification_number' => $data['identification_number'],
                    'birthdate' => $data['date_of_birth'],
                    'place_of_birth' => $data['place_of_birth'],
                    'occupation' => $data['occupation'],
                    'education' => $data['education'],
                    'religion' => $data['religion'],
                    'income' => $data['income'],
                    'primary_language' => $data['primary_language'],
                    // Address fields
                    'region' => $data['address']['region'],
                    'city' => $data['address']['city'],
                    'wereda' => $data['address']['woreda'],
                    'zone' => $data['address']['zone'],
                    'kebele' => $data['address']['kebele'],
                    'house_no' => $data['address']['house_no'],
                    'street_name' => $data['address']['street_name'] ?? null,
                    'apartment' => $data['address']['apartment'] ?? null,

                    // BSS Classification (defaults match third-party API defaults)
                    'customer_type' => $data['customer_type'] ?? '1',
                    'customer_category' => $data['customer_category'] ?? '1',
                    'customer_subcategory' => $data['customer_subcategory'] ?? '1',
                    'customer_level' => $data['customer_level'] ?? '1',
                    // Notification & Credit
                    'notification_mode' => $data['contact']['notification_mode'] ?? '2',
                    'credit_class' => $data['credit_class'] ?? 'Excellent',
                    'verified_at' => now(),
                    'updated_at' => now(),
                ]);

            // Update OTP record
            DB::table('otps')
                ->where('customer_sub_id', $customerSubId)
                ->update([
                    'customer_code' => $customerCode,
                    'updated_at' => now(),
                ]);
        });

        AppLogger::business()->info('Customer profile created', [
            'customer_code' => $customerCode,
            'transaction_id' => $this->transactionId,
        ]);

        return ApiResponse::success([
            'response_time' => (string) $headerData->ResponseTime ?? '',
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'customer_id' => (string) $customerData->CustomerId ?? '',
            'customer_code' => $customerCode,
            'transaction_id' => $this->transactionId,
        ]);
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

    protected function endpoint(): string
    {
        return config('services.customer.create_endpoint');
    }
}
