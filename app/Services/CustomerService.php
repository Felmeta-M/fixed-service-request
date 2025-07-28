<?php

namespace App\Services;

use Exception;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CustomerService
{

    public function queryCustomer(string $serviceNumber)
    {
        try {
            $xml = $this->buildQueryRequestXml($serviceNumber);
            $response = Http::withHeaders([
                'Content-Type' => 'text/xml; charset=utf-8',
            ])->send('POST', config('services.customer.query_endpoint'), [
                'body' => $xml,
            ]);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Query customer request Failed'
                ], 500);
            }
            if ($response->successful()) {
                return $this->parseResponse($response->body());
            }
        } catch (RequestException $e) {
            Log::error('RequestException', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to communicate with third-party service'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Unexpected Exception', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unExcepted error occurred'
            ]);
        }
    }

    public function createCustomer(array $data)
    {
        try {
            $xml = $this->buildXml($data);
            $response = Http::withHeaders([
                'Content-Type' => 'text/xml; charset=utf-8',
            ])->send('POST', config('services.customer.create_endpoint'), [
                'body' => $xml,
            ]);


            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Create customer request Failed'
                ], 500);
            }

            if ($response->successful()) {
                return $this->parseResponse($response->body());
            }
        } catch (RequestException $e) {
            Log::error('RequestException', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to communicate with third-party service'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Unexpected Exception', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unExcepted error occurred'
            ]);
        }
    }

    protected function buildXml(array $data): string
    {
        $credentials = config('services.customer');
        $transactionId = uniqid();
        $processTime = now()->format('YmdHis');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
    xmlns:ser="http://oss.huawei.com/webservice/bss/services" 
    xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
    <soapenv:Header/>
    <soapenv:Body>
        <ser:CreateNewCustomerReqMsg>
            <ser:RequestHeader>
                <com:Version>1</com:Version>
                <com:TransactionId>{$transactionId}</com:TransactionId>
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
            <com:EthioZoneOrRegion>{$data['address'][0]['region']}</com:EthioZoneOrRegion>
            <com:AdministrativeRegionOrCity>{$data['address'][0]['city']}</com:AdministrativeRegionOrCity>
            <com:SubcityOrZone>{$data['address'][0]['zone']}</com:SubcityOrZone>
            <com:WeredaOrTown>{$data['address'][0]['wereda']}</com:WeredaOrTown>
            <com:Kebele>{$data['address'][0]['kebele']}</com:Kebele>
            <com:HouseNo>{$data['address'][0]['house_no']}</com:HouseNo>
        </com:CustomerAddressInfo>
    
        <com:CustomerContactInfo>
            <com:NotificationMode>{$data['contact'][0]['notification_mode']}</com:NotificationMode>
            <com:Email>{$data['contact'][0]['email']}</com:Email>
            <com:HomeNo>{$data['contact'][0]['home_no']}</com:HomeNo>
            <com:OfficeNo>{$data['contact'][0]['office_no']}</com:OfficeNo>
            <com:MobileNo>{$data['contact'][0]['mobile_no']}</com:MobileNo>
            <com:FaxNo>{$data['contact'][0]['fax_no']}</com:FaxNo>
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

    private function buildQueryRequestXml(string $serviceNumber): string
    {
        $credentials = config('services.customer');
        $transactionId = uniqid();
        $processTime = now()->format('YmdHis');

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:quer="http://crm.huawei.com/query/" xmlns:bas="http://crm.huawei.com/basetype/">
   <soapenv:Header/>
   <soapenv:Body>
      <quer:GetCombiningRequest>
         <quer:RequestHeader>
            <bas:Version>1</bas:Version>
            <bas:TransactionId>{$transactionId}</bas:TransactionId>
            <bas:ProcessTime>{$processTime}</bas:ProcessTime>
            <com:Language>2022</com:Language>
            <com:ChannelId>{$credentials['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$credentials['technical_channel_id']}</com:TechnicalChannelId>
            <com:TenantId>{$credentials['tenant_id']}</com:TenantId>
            <com:AccessUser>{$credentials['access_user']}</com:AccessUser>
            <com:AccessPwd>{$credentials['access_password']}</com:AccessPwd>
         </quer:RequestHeader>
         <quer:GetCombiningBody>
            <quer:ServiceNumber>{$serviceNumber}</quer:ServiceNumber>
         </quer:GetCombiningBody>
      </quer:GetCombiningRequest>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    public function parseResponse(string $xml): array
    {
        $xmlObject = simplexml_load_string($xml);

        // Register namespaces from the root
        $namespaces = $xmlObject->getNamespaces(true);

        // Navigate to the Body
        $body = $xmlObject->children($namespaces['soapenv'])->Body;

        // Get the response message
        $response = $body->children($namespaces['ser'])->CreateNewCustomerRspMsg;

        $header = $response->children($namespaces['ser'])->ResponseHeader;
        $headerData = $header->children($namespaces['com']);

        $bodyData = $response->children($namespaces['ser'])->CreateNewCustomerRespBody;
        $customerData = $bodyData->children($namespaces['com']);

        return [
            'response_time' => (string) $headerData->ResponseTime ?? '',
            'ret_code'      => (string) $headerData->RetCode ?? '',
            'ret_msg'       => (string) $headerData->RetMsg ?? '',
            'customer_id'   => (string) $customerData->CustomerId ?? '',
            'customer_code' => (string) $customerData->CustomerCode ?? '',
        ];
    }
}
