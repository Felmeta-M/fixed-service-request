<?php

namespace App\Services;


use App\Models\Customer;
use App\Models\Otp;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Log;
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
            $xmlPayload = $this->buildXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedXml = $this->parseResponse($xmlResponse, $data);
            return ApiResponse::success($parsedXml);
        } catch (RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (Throwable $e) {
            return ApiResponse::exception($e, 'Customer create failed.');
        }
    }

    protected function buildXml(array $data): string
    {
        $credentials = config('services.customer');
        $processTime = now()->format('YmdHis');
        $this->transactionId = uniqid();
        if (!$this->transactionId) {
            throw new InvalidArgumentException('Transaction id cannot empty');
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
                <com:Language>2022</com:Language>
                <com:ChannelId>{$credentials['channel_id']}</com:ChannelId>
                <com:TechnicalChannelId>{$credentials['technical_channel_id']}</com:TechnicalChannelId>
                <com:TenantId>{$credentials['tenant_id']}</com:TenantId>
                <com:AccessUser>{$credentials['access_user']}</com:AccessUser>
                <com:AccessPwd>{$credentials['access_password']}</com:AccessPwd>
            </ser:RequestHeader>
            <ser:CreateNewCustomerReqBody>
                {$this->buildCustomerInfo($data)}
            </ser:CreateNewCustomerReqBody>
        </ser:CreateNewCustomerReqMsg>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function buildCustomerInfo(array $data): string
    {
        $data['contact'] = array_merge([
            'notification_mode' => '',
            'email' => '',
            'home_no' => '',
            'office_no' => '',
            'mobile_no' => '',
            'fax_no' => '',
        ], $data['contact'] ?? []);

        // Ensure contact_person exists and contains index 0
        $data['contact_person'][0] = array_merge([
            'first_name' => '',
            'middle_name' => '',
            'last_name' => '',
            'title' => '',
            'home_no' => '',
            'office_no' => '',
            'mobile_no' => '',
            'fax_no' => '',
        ], $data['contact_person'][0] ?? []);

        return <<<XML
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
            <com:EthioZoneOrRegion>{$data['address']['region']}</com:EthioZoneOrRegion>
            <com:AdministrativeRegionOrCity>{$data['address']['city']}</com:AdministrativeRegionOrCity>
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

        <com:CustomerContactPersonInfoList>
            <com:ContactPersonInfo>
                <com:FirstName>{$data['contact_person'][0]['first_name']}</com:FirstName>
                <com:MiddleName>{$data['contact_person'][0]['middle_name']}</com:MiddleName>
                <com:LastName>{$data['contact_person'][0]['last_name']}</com:LastName>
                <com:Title>{$data['contact_person'][0]['title']}</com:Title>
                <com:HomeNo>{$data['contact_person'][0]['home_no']}</com:HomeNo>
                <com:OfficeNo>{$data['contact_person'][0]['office_no']}</com:OfficeNo>
                <com:MobileNo>{$data['contact_person'][0]['mobile_no']}</com:MobileNo>
                <com:FaxNo>{$data['contact_person'][0]['fax_no']}</com:FaxNo>
            </com:ContactPersonInfo>
        </com:CustomerContactPersonInfoList>
    </com:CustomerInfo>
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
        $retCode = (string)$headerData->RetCode;
        $retMsg = (string)$headerData->RetMsg;

        if ($retCode !== '0') {
            return ApiResponse::error("Create customer profile failed: {$retMsg}");
        }

        $customerCode = (string)$customerData->CustomerCode ?? '';

        $customerResponse = DB::transaction(function () use ($customerCode, $data) {
            $currentUser = Auth::guard('api')->user();

            if (!$currentUser) {
                throw new Exception("Authenticated OTP user not found.");
            }

            // Update customer
            Customer::where('sub', $currentUser->customer_sub_id)
                ->update([
                    'code' => $customerCode,
                    'contact' => $data['contact'],
                    'contact_persons' => $data['contact_person'],
                    'region' => $data['address']['region'],
                    'city' => $data['address']['city'],
                    'wereda' => $data['address']['woreda'],
                    'zone' => $data['address']['zone'],
                    'kebele' => $data['address']['kebele'],
                    'house_no' => $data['address']['house_no'],
                    'verified_at' => now(),
                ]);

            // Update OTP
            Otp::where('customer_sub_id', $currentUser->customer_sub_id)
                ->update([
                    'customer_code' => $customerCode,
                ]);

            return $currentUser;
        });


        return ApiResponse::success([
            'response_time' => (string)$headerData->ResponseTime ?? '',
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'customer_id' => (string)$customerData->CustomerId ?? '',
            'customer_code' => $customerCode,
            'transaction_id' => $this->transactionId,
        ]);
    }

    public function getLocalCustomerData($customerSubId): ?Customer
    {
        try {
            $customer = Customer::query()->where('sub', $customerSubId)->first();

            if (!$customer) {
                Log::warning('No local customer found for pre-filling', [
                    'customer_id' => $customerSubId
                ]);
                return null;
            }
            return $customer;
        } catch (Exception $e) {
            Log::error('Error getting local customer data', [
                'customer_id' => $customerSubId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    protected function endpoint(): string
    {
        return config('services.customer.create_endpoint');
    }
}
