<?php

namespace App\Services;

use App\Services\Logging\AppLogger;
use RuntimeException;
use Throwable;

/**
 * Query Customer by Service Number for Trouble Ticket Creation
 * 
 * This service queries the CRM API to get customer profile data
 * based on a service number. Used for TT creation to get the
 * correct customer info (not the logged-in user).
 * 
 * Endpoint: IPCC/OrderQueryETCtz (CRM Huawei API)
 */
class QueryCustomerForTTService extends BaseApiService
{
    protected int $timeout = 15;
    protected int $rateLimit = 30;


    /**
     * Get the API endpoint
     */
    protected function endpoint(): string
    {
        return config('services.query_customer_for_tt.endpoint');
    }

    /**
     * Query customer by service number
     * 
     * @param string $serviceNumber The fixed service number to query
     * @return array Customer data or error response
     */
    public function query(string $serviceNumber): array
    {
        try {
            if (empty($serviceNumber)) {
                return ApiResponse::error('Service number is required', 400)->getData(true);
            }

            AppLogger::api()->info('QueryCustomerForTT: Querying customer', [
                'service_number' => $serviceNumber,
            ]);

            $xmlPayload = $this->buildRequestXml($serviceNumber);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsed = $this->parseResponseXml($xmlResponse, $serviceNumber);

            return $parsed;
        } catch (RuntimeException $e) {
            AppLogger::api()->error('QueryCustomerForTT: Runtime error', [
                'service_number' => $serviceNumber,
                'error' => $e->getMessage(),
            ]);
            return ApiResponse::error($e->getMessage(), 500)->getData(true);
        } catch (Throwable $e) {
            AppLogger::api()->error('QueryCustomerForTT: Exception', [
                'service_number' => $serviceNumber,
                'error' => $e->getMessage(),
            ]);
            return ApiResponse::error('Failed to query customer: ' . $e->getMessage(), 500)->getData(true);
        }
    }

    /**
     * Build SOAP XML request for CRM GetCustomer API
     */
    protected function buildRequestXml(string $serviceNumber): string
    {
        $config = config('services.query_customer_for_tt');
        $transactionId = date('YmdHis') . rand(1000, 9999);
        $processTime = date('YmdHis');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:quer="http://crm.huawei.com/query/" 
                  xmlns:bas="http://crm.huawei.com/basetype/">
    <soapenv:Header/>
    <soapenv:Body>
        <quer:GetCustomerRequest>
            <quer:RequestHeader>
                <bas:Version>1</bas:Version>
                <bas:TransactionId>{$transactionId}</bas:TransactionId>
                <bas:ProcessTime>{$processTime}</bas:ProcessTime>
                <bas:Language>{$config['language']}</bas:Language>
                <bas:ChannelId>{$config['channel_id']}</bas:ChannelId>
                <bas:TechnicalChannelId>{$config['technical_channel_id']}</bas:TechnicalChannelId>
                <bas:TenantId>{$config['tenant_id']}</bas:TenantId>
                <bas:AccessUser>{$config['access_user']}</bas:AccessUser>
                <bas:AccessPwd>{$config['access_pwd']}</bas:AccessPwd>
            </quer:RequestHeader>
            <quer:GetCustomerBody>
                <quer:ServiceNumber>{$serviceNumber}</quer:ServiceNumber>
            </quer:GetCustomerBody>
        </quer:GetCustomerRequest>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Parse SOAP XML response
     * 
     * @param string $xml Raw XML response
     * @param string $serviceNumber Original service number for logging
     * @return array Parsed customer data
     */
    protected function parseResponseXml(string $xml, string $serviceNumber): array
    {
        libxml_use_internal_errors(true);

        $xmlObject = simplexml_load_string($xml);
        if ($xmlObject === false) {
            throw new RuntimeException('Failed to parse XML response');
        }

        $namespaces = $xmlObject->getNamespaces(true);

        // Register namespaces for XPath
        $xmlObject->registerXPathNamespace('soapenv', $namespaces['soapenv'] ?? 'http://schemas.xmlsoap.org/soap/envelope/');
        $xmlObject->registerXPathNamespace('quer', $namespaces['quer'] ?? 'http://crm.huawei.com/query/');
        $xmlObject->registerXPathNamespace('bas', $namespaces['bas'] ?? 'http://crm.huawei.com/basetype/');

        // Navigate to response body
        $body = $xmlObject->children($namespaces['soapenv'] ?? 'http://schemas.xmlsoap.org/soap/envelope/')->Body;
        $response = $body->children($namespaces['quer'] ?? 'http://crm.huawei.com/query/')->GetCustomerResponse;

        if (!$response) {
            throw new RuntimeException('Invalid response: GetCustomerResponse not found');
        }

        // Parse response header
        $responseHeader = $response->ResponseHeader;
        $basNs = $namespaces['bas'] ?? 'http://crm.huawei.com/basetype/';

        $retCode = (string) ($responseHeader->children($basNs)->RetCode ?? $responseHeader->RetCode ?? '');
        $retMsg = (string) ($responseHeader->children($basNs)->RetMsg ?? $responseHeader->RetMsg ?? '');

        if ($retCode !== '0') {
            AppLogger::api()->warning('QueryCustomerForTT: API returned error', [
                'service_number' => $serviceNumber,
                'ret_code' => $retCode,
                'ret_msg' => $retMsg,
            ]);
            return [
                'success' => false,
                'message' => $retMsg ?: 'Customer not found for service number: ' . $serviceNumber,
                'ret_code' => $retCode,
            ];
        }

        // Parse response body
        $customerBody = $response->GetCustomerBody;
        $querNs = $namespaces['quer'] ?? 'http://crm.huawei.com/query/';

        // Extract customer data
        $result = [
            'success' => true,
            'message' => 'Customer found',
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'customer' => [
                'customer_id' => (string) ($customerBody->CustomerId ?? ''),
                'customer_code' => (string) ($customerBody->CustomerCode ?? ''),
                'title' => (string) ($customerBody->Title ?? '1'),
                'first_name' => (string) ($customerBody->FirstName ?? ''),
                'middle_name' => (string) ($customerBody->MiddleName ?? ''),
                'last_name' => (string) ($customerBody->LastName ?? ''),
                'nationality' => (string) ($customerBody->Nationality ?? '1231'),
                'customer_type' => (string) ($customerBody->CustomerType ?? '0'),
                'customer_level' => (string) ($customerBody->CustomerLevel ?? '2'),
                'customer_language' => (string) ($customerBody->CustomerLanguage ?? '2002'),
                'gender' => (string) ($customerBody->Gender ?? ''),
                'certificate_type' => (string) ($customerBody->CertificateType ?? ''),
                'certificate_number' => (string) ($customerBody->CertificateNumber ?? ''),
                'tenant_id' => (string) ($customerBody->TenantId ?? '101'),
                'date_of_birth' => (string) ($customerBody->DateOfBirth ?? ''),
                'occupation' => (string) ($customerBody->Occupation ?? ''),
                'religion' => (string) ($customerBody->Religion ?? ''),
                'education' => (string) ($customerBody->Education ?? ''),
                'status' => (string) ($customerBody->Status ?? ''),
            ],
            'addresses' => [],
            'contacts' => [],
            'subscribers' => [],
            'ext_params' => [],
        ];

        // Parse address list
        $addressList = $customerBody->AddressList;
        if ($addressList) {
            foreach ($addressList->children($basNs)->AddressInfo ?? [] as $address) {
                $result['addresses'][] = [
                    'address_class' => (string) ($address->AddressClass ?? ''),
                    'address_type' => (string) ($address->AddressType ?? ''),
                    'local_id' => (string) ($address->LocalId ?? ''),
                    'address1' => (string) ($address->Address1 ?? ''), // Ethio Zone/Region
                    'address2' => (string) ($address->Address2 ?? ''), // Admin Region/City
                    'address3' => (string) ($address->Address3 ?? ''), // Subcity/Zone
                    'address4' => (string) ($address->Address4 ?? ''), // Wereda/Town
                    'address5' => (string) ($address->Address5 ?? ''), // Kebele
                    'address6' => (string) ($address->Address6 ?? ''), // House No
                ];
            }
        }

        // Parse contact list
        $contactList = $customerBody->ContactList;
        if ($contactList) {
            foreach ($contactList->children($basNs)->ContactInfo ?? [] as $contact) {
                $result['contacts'][] = [
                    'rela_seq' => (string) ($contact->RelaSeq ?? ''),
                    'language' => (string) ($contact->Language ?? ''),
                    'name1' => (string) ($contact->Relaname1 ?? ''),
                    'name2' => (string) ($contact->Relaname2 ?? ''),
                    'name3' => (string) ($contact->Relaname3 ?? ''),
                    'tel1' => (string) ($contact->Relatel1 ?? ''),
                    'tel3' => (string) ($contact->Relatel3 ?? ''),
                    'tel4' => (string) ($contact->Relatel4 ?? ''),
                    'title' => (string) ($contact->Title ?? ''),
                ];
            }
        }

        // Parse subscriber list
        $subscriberList = $customerBody->SubscriberList;
        if ($subscriberList) {
            foreach ($subscriberList->children($basNs)->SubscriberAbstractInfo ?? [] as $subscriber) {
                $result['subscribers'][] = [
                    'subscriber_id' => (string) ($subscriber->SubscriberId ?? ''),
                    'service_number' => (string) ($subscriber->ServiceNumber ?? ''),
                    'payment_type' => (string) ($subscriber->PaymentType ?? ''),
                    'default_account_id' => (string) ($subscriber->DefaultAccountId ?? ''),
                    'status' => (string) ($subscriber->Status ?? ''),
                ];
            }
        }

        // Parse extended parameters
        $extParamList = $customerBody->ExtParamList;
        if ($extParamList) {
            foreach ($extParamList->children($basNs)->ParameterInfo ?? [] as $param) {
                $paramName = (string) ($param->ParamName ?? '');
                $paramValue = (string) ($param->ParamValue ?? '');
                if ($paramName) {
                    $result['ext_params'][$paramName] = $paramValue;
                }
            }
        }

        AppLogger::api()->info('QueryCustomerForTT: Customer found', [
            'service_number' => $serviceNumber,
            'customer_code' => $result['customer']['customer_code'],
        ]);

        return $result;
    }


}
