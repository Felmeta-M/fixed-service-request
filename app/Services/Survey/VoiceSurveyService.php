<?php

namespace App\Services\Survey;

use App\Services\ApiResponse;
use App\Support\CustomerContext;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use App\Services\QueryAvailableNumberService;
use App\Services\ReserveNumberService;
use App\Services\Payment\PaymentService;


class VoiceSurveyService extends BaseSurveyService implements SurveyInterface
{
    public function __construct(
        PaymentService $payment_service,
        QueryAvailableNumberService $queryAvailableNumberService,
        ReserveNumberService $reserveNumberService,
    ) {
        parent::__construct(
            $payment_service,
            $queryAvailableNumberService,
            $reserveNumberService
        );
    }

    protected function mainOfferId(): int
    {
        return 1207609454;
    }

    protected function buildXml(array $data, array $resource): string
    {
        $cfg = config('services.survey');

        // Use shared helpers for timestamps
        $transactionId = $this->transactionId();
        $processTime = $this->processTime();
        $sessionId = uniqid();
        $completedDate = $this->completedDate();

        // Use shared helpers for contact info
        $primaryContact = $this->getPrimaryContact($data);
        $customerCode = $this->customerCode($data['customer_code'] ?? null);

        $houseNo = $data['survey_address_info']['house_no'] ?? CustomerContext::houseNo('');

        $depId = "1766044689199549668";
        // fetch from db;
        $this->serviceNumber = $this->queryAvailableNumberService->getAvailableNumberServices($depId);

        if (!$this->serviceNumber) {
            throw new \RuntimeException('Unable to reserve service number');
        }

        $data['service_number'] = $this->serviceNumber;




        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
<soapenv:Body>
<ser:HandleSurveyOrderReqMsg>
<ser:RequestHeader>
<com:Version>1</com:Version>
<com:TransactionId>{$transactionId}</com:TransactionId>
<com:SessionId>{$sessionId}</com:SessionId>
<com:ProcessTime>{$processTime}</com:ProcessTime>
<com:Language>{$cfg['language']}</com:Language>
<com:ChannelId>{$cfg['channel_id']}</com:ChannelId>
<com:TechnicalChannelId>{$cfg['technical_channel_id']}</com:TechnicalChannelId>
<com:TenantId>{$cfg['tenant_id']}</com:TenantId>
<com:AccessUser>{$cfg['access_user']}</com:AccessUser>
<com:AccessPwd>{$cfg['access_password']}</com:AccessPwd>
</ser:RequestHeader>
<ser:HandleSurveyOrderReqBody>
<com:CustomerCode>{$customerCode}</com:CustomerCode>
<com:SurveyType>{$data['survey_type']}</com:SurveyType>
<com:TelecomRegion>{$resource['area_code']}</com:TelecomRegion>
<com:OperType>{$data['oper_type']}</com:OperType>
<com:MainOfferId>{$this->mainOfferId()}</com:MainOfferId>
<com:SurveyAddressInfo>
<com:AdministrativeRegionOrCity>{$data['survey_address_info']['region_city']}</com:AdministrativeRegionOrCity>
<com:SubcityOrZone>{$data['survey_address_info']['subcity_zone']}</com:SubcityOrZone>
<com:WeredaOrTown>{$data['survey_address_info']['wereda_town']}</com:WeredaOrTown>
<com:Kebele>{$data['survey_address_info']['kebele']}</com:Kebele>
<com:HouseNo>{$houseNo}</com:HouseNo>
<com:SupplementAddress>{$data['survey_address_info']['address']}</com:SupplementAddress>
</com:SurveyAddressInfo>
<com:ContactPerson>{$primaryContact['contact_person']}</com:ContactPerson>
<com:ContactNo>{$primaryContact['contact_no']}</com:ContactNo>
<com:ContactEmail>{$primaryContact['contact_email']}</com:ContactEmail>
<com:CompletedDate>{$completedDate}</com:CompletedDate>
<com:ExternalOperid>{$data['external_operid']}</com:ExternalOperid>
<com:ExtParamList>
<com:ParameterInfo><com:ParamName>NEID</com:ParamName><com:ParamValue>{$resource['neid']}</com:ParamValue></com:ParameterInfo>
<com:ParameterInfo><com:ParamName>CABLETYPE</com:ParamName><com:ParamValue>3</com:ParamValue></com:ParameterInfo>
<com:ParameterInfo><com:ParamName>NUMBER_LINE</com:ParamName><com:ParamValue>1</com:ParamValue></com:ParameterInfo>
<com:ParameterInfo><com:ParamName>LONGITUDE</com:ParamName><com:ParamValue>{$resource['longitude']}</com:ParamValue></com:ParameterInfo>
<com:ParameterInfo><com:ParamName>LATITUDE</com:ParamName><com:ParamValue>{$resource['latitude']}</com:ParamValue></com:ParameterInfo>
<com:ParameterInfo><com:ParamName>GIS_FLAG</com:ParamName><com:ParamValue>True</com:ParamValue></com:ParameterInfo>
</com:ExtParamList>
</ser:HandleSurveyOrderReqBody>
</ser:HandleSurveyOrderReqMsg>
</soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponse(array $data, string $xml, ?array $resource)
    {
        try {
            libxml_use_internal_errors(true);
            $parsed = simplexml_load_string($xml);

            if ($parsed === false) {
                $errors = array_map(fn($e) => $e->message, libxml_get_errors());
                libxml_clear_errors();

                // Cleanup: release service number if survey creation failed
                if ($this->serviceNumber) {
                    try {
                        $this->queryAvailableNumberService->releaseNumberService($this->serviceNumber);
                    } catch (\Throwable $e) {
                        Log::error('Failed to release service number after XML parse error', [
                            'service_number' => $this->serviceNumber,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                Log::error('Failed to parse survey order XML response', [
                    'xml_preview' => substr($xml, 0, 500),
                    'errors' => $errors,
                ]);

                return ApiResponse::error('Invalid response from survey service. Please try again.');
            }

            $ns = $parsed->getNamespaces(true);
            $body = $parsed->children($ns['soapenv'])->Body ?? null;

            if (!$body) {
                if ($this->serviceNumber) {
                    try {
                        $this->queryAvailableNumberService->releaseNumberService($this->serviceNumber);
                    } catch (\Throwable $e) {
                        Log::error('Failed to release service number after missing SOAP Body', [
                            'service_number' => $this->serviceNumber,
                        ]);
                    }
                }
                return ApiResponse::error('Invalid response structure from survey service.');
            }

            $rsp = $body->children($ns['ser'])->HandleSurveyOrderRspMsg ?? null;

            if (!$rsp) {
                if ($this->serviceNumber) {
                    try {
                        $this->queryAvailableNumberService->releaseNumberService($this->serviceNumber);
                    } catch (\Throwable $e) {
                        Log::error('Failed to release service number after missing response message', [
                            'service_number' => $this->serviceNumber,
                        ]);
                    }
                }
                return ApiResponse::error('Invalid response message from survey service.');
            }

            $hdr = $rsp->ResponseHeader->children($ns['com']) ?? null;

            if (!$hdr) {
                if ($this->serviceNumber) {
                    try {
                        $this->queryAvailableNumberService->releaseNumberService($this->serviceNumber);
                    } catch (\Throwable $e) {
                        Log::error('Failed to release service number after missing response header', [
                            'service_number' => $this->serviceNumber,
                        ]);
                    }
                }
                return ApiResponse::error('Invalid response header from survey service.');
            }

            $retCode = (string) ($hdr->RetCode ?? '');
            $retMsg = (string) ($hdr->RetMsg ?? 'Unknown error');

            if ($retCode !== '0') {
                // Cleanup: release service number if survey creation failed
                if ($this->serviceNumber) {
                    try {
                        $this->queryAvailableNumberService->releaseNumberService($this->serviceNumber);
                    } catch (\Throwable $e) {
                        Log::error('Failed to release service number after survey order failed', [
                            'service_number' => $this->serviceNumber,
                            'ret_code' => $retCode,
                            'ret_msg' => $retMsg,
                        ]);
                    }
                }

                return ApiResponse::error($retMsg);
            }

            $surveyOrderId = (string) ($rsp->HandleSurveyOrderRespBody
                ->children($ns['com'])->CustomerSurveyOrderId ?? '');

            if (empty($surveyOrderId)) {
                // Cleanup: release service number if survey order ID is missing
                if ($this->serviceNumber) {
                    try {
                        $this->queryAvailableNumberService->releaseNumberService($this->serviceNumber);
                    } catch (\Throwable $e) {
                        Log::error('Failed to release service number after missing survey order ID', [
                            'service_number' => $this->serviceNumber,
                        ]);
                    }
                }

                return ApiResponse::error('Survey order ID not found in response.');
            }

            try {
                $this->persistSurvey($surveyOrderId, $data, $resource);
            } catch (\Throwable $e) {
                // Cleanup: release service number if persistence fails
                if ($this->serviceNumber) {
                    try {
                        $this->queryAvailableNumberService->releaseNumberService($this->serviceNumber);
                    } catch (\Throwable $releaseError) {
                        Log::error('Failed to release service number after persistence failure', [
                            'service_number' => $this->serviceNumber,
                            'persist_error' => $e->getMessage(),
                            'release_error' => $releaseError->getMessage(),
                        ]);
                    }
                }

                Log::error('Failed to persist survey order', [
                    'survey_order_id' => $surveyOrderId,
                    'error' => $e->getMessage(),
                ]);

                return ApiResponse::error('Failed to save survey order. Please try again.');
            }

            return ApiResponse::success([
                'customer_survey_order_id' => $surveyOrderId
            ]);

        } catch (\Throwable $e) {
            // Final cleanup: release service number on any unexpected error
            if ($this->serviceNumber) {
                try {
                    $this->queryAvailableNumberService->releaseNumberService($this->serviceNumber);
                } catch (\Throwable $releaseError) {
                    Log::error('Failed to release service number after exception', [
                        'service_number' => $this->serviceNumber,
                        'exception' => $e->getMessage(),
                        'release_error' => $releaseError->getMessage(),
                    ]);
                }
            }

            Log::error('Unexpected error in survey order processing', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return ApiResponse::error('An unexpected error occurred. Please try again.');
        }
    }
}
