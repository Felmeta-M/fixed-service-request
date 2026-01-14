<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyOrder;
use Illuminate\Http\JsonResponse;
use RuntimeException;
use Throwable;

class ComboSurveyOrderService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    public function __construct() {}

    public function createSurveyOrder(array $data, array $resourceCheck = []): JsonResponse
    {
        try {
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);

            $parsedXml = $this->parseResponseXml($data, $xmlResponse, $resourceCheck);

            return ApiResponse::success($parsedXml);
        } catch (RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (Throwable $e) {
            return ApiResponse::exception($e, 'Create Fixed Combo survey order failed.');
        }
    }

    private function buildRequestXml(array $data): string
    {
        $credentials = config('services.survey');

        // Use shared helpers for timestamps
        $transactionId = $this->transactionId();
        $processTime = $this->processTime();
        $sessionId = $credentials['session_id'] ?? uniqid();
        $completedDate = $this->completedDate();

        // Use shared helpers for contact info
        $primaryContact = $this->getPrimaryContact($data);
        $secondaryContact = $this->getSecondaryContact($data);

        // Use customer context for customer code
        $customerCode = $this->customerCode($data['customer_code'] ?? null);

        $mainExtParams = [
            'NEID' => '700041565830',
            'CABLETYPE' => '3',
            'LONGITUDE' => $data['survey_address_info']['longitude'] ?? '38.733694',
            'LATITUDE' => $data['survey_address_info']['latitude'] ?? '9.007778',
            'GIS_FLAG' => 'True',
        ];

        $subSurveys = [
            [
                'main_offer_id' => 1207609454,
                'bandwidth' => null,
                'ext_params' => [
                    'NEID' => '700041565830',
                    'CABLETYPE' => '3',
                    'NUMBER_LINE' => '1',
                ],
            ],
            [
                'main_offer_id' => 1457567289,
                'bandwidth' => 5120,
                'ext_params' => [
                    'NEID' => '700041565830',
                    'CABLETYPE' => '3',
                ],
            ],
        ];

        $subSurveyXml = '';
        foreach ($subSurveys as $sub) {
            $extParamXml = '';
            foreach ($sub['ext_params'] as $name => $value) {
                $extParamXml .= <<<XML
<com:ParameterInfo>
    <com:ParamName>{$name}</com:ParamName>
    <com:ParamValue>{$value}</com:ParamValue>
</com:ParameterInfo>
XML;
            }

            $bandwidthXml = $sub['bandwidth'] ? "<com:bandwidth>{$sub['bandwidth']}</com:bandwidth>" : '';

            $subSurveyXml .= <<<XML
<com:SubSurveyinfoList>
    <com:MainOfferId>{$sub['main_offer_id']}</com:MainOfferId>
    {$bandwidthXml}
    <com:ExtParamList>
        {$extParamXml}
    </com:ExtParamList>
</com:SubSurveyinfoList>
XML;
        }

        $mainExtParamXml = '';
        foreach ($mainExtParams as $name => $value) {
            $mainExtParamXml .= <<<XML
<com:ParameterInfo>
    <com:ParamName>{$name}</com:ParamName>
    <com:ParamValue>{$value}</com:ParamValue>
</com:ParameterInfo>
XML;
        }

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:HandleSurveyOrderReqMsg>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:SessionId>{$sessionId}</com:SessionId>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:Language>{$credentials['language']}</com:Language>
            <com:ChannelId>{$credentials['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$credentials['technical_channel_id']}</com:TechnicalChannelId>
            <com:TenantId>{$credentials['tenant_id']}</com:TenantId>
            <com:AccessUser>{$credentials['access_user']}</com:AccessUser>
            <com:AccessPwd>{$credentials['access_password']}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:HandleSurveyOrderReqBody>
            <com:CustomerCode>{$customerCode}</com:CustomerCode>
            <com:SurveyType>{$data['survey_type']}</com:SurveyType>
            <com:TelecomRegion>{$data['telecom_region']}</com:TelecomRegion>
            <com:OperType>{$data['oper_type']}</com:OperType>
            <com:MainOfferId>180427974</com:MainOfferId>
            <com:SurveyAddressInfo>
               <com:AdministrativeRegionOrCity>{$data['survey_address_info']['region_city']}</com:AdministrativeRegionOrCity>
               <com:SubcityOrZone>{$data['survey_address_info']['subcity_zone']}</com:SubcityOrZone>
               <com:WeredaOrTown>{$data['survey_address_info']['wereda_town']}</com:WeredaOrTown>
               <com:Kebele>{$data['survey_address_info']['kebele']}</com:Kebele>
               <!-- <com:HouseNo>{$data['survey_address_info']['house_no']}</com:HouseNo> -->
               <com:SupplementAddress>{$data['survey_address_info']['address']}</com:SupplementAddress>
            </com:SurveyAddressInfo>
            {$subSurveyXml}
            <com:bandwidth>{$data['bandwidth']}</com:bandwidth>
            <com:ContactPerson>{$primaryContact['contact_person']}</com:ContactPerson>
            <com:ContactNo>{$primaryContact['contact_no']}</com:ContactNo>
            <com:ContactEmail>{$primaryContact['contact_email']}</com:ContactEmail>
            <com:CompletedDate>{$completedDate}</com:CompletedDate>
            <com:SecContactPerson>{$secondaryContact['sec_contact_person']}</com:SecContactPerson>
            <com:SecContactNo>{$secondaryContact['sec_contact_no']}</com:SecContactNo>
            <com:SecContactEmail>{$secondaryContact['sec_contact_email']}</com:SecContactEmail>
            <com:ExternalOperid>{$data['external_operid']}</com:ExternalOperid>
            <com:ExtParamList>
                {$mainExtParamXml}
            </com:ExtParamList>
         </ser:HandleSurveyOrderReqBody>
      </ser:HandleSurveyOrderReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponseXml(array $data, string $xml, array $resourceCheck = [])
    {
        $parsed = simplexml_load_string($xml);
        $namespaces = $parsed->getNamespaces(true);
        $body = $parsed->children($namespaces['soapenv'])->Body;
        $responseMsg = $body->children($namespaces['ser'])->HandleSurveyOrderRspMsg;
        $responseHeader = $responseMsg->ResponseHeader->children($namespaces['com']);
        $responseBody = $responseMsg->HandleSurveyOrderRespBody->children($namespaces['com']);

        $retCode = (string)$responseHeader->RetCode;
        $retMsg = (string)$responseHeader->RetMsg;

        if ($retCode !== '0') {
            return ApiResponse::error('Unable to create Fixed Combo survey order');
        }

        $customerSurveyOrderId = (string)$responseBody->CustomerSurveyOrderId;

        $this->createLocalSurveyOrder($customerSurveyOrderId, $data, $resourceCheck);

        return [
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => (string)$responseHeader->ResponseTime,
            'customer_survey_order_id' => $customerSurveyOrderId,
        ];
    }

    protected function createLocalSurveyOrder(string $customerSurveyOrderId, array $data, array $resourceCheck = [])
    {
        SurveyOrder::create([
            ...$data,
            'customer_survey_order_id' => $customerSurveyOrderId,
            'status' => FFDServiceProvisionStatus::Completed->value,
            'cable_length' => $resourceCheck['distance'] ?? null,
            'cable_type'   => $resourceCheck['cable_type'] ?? null,
            'lat'          => $resourceCheck['latitude'] ?? null,
            'long'         => $resourceCheck['longitude'] ?? null,
        ]);
    }

    protected function endpoint(): string
    {
        return config('services.survey.endpoint');
    }
}
