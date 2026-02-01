<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;

class QuerySurveyOrderService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.ng.endpoint');
    }

    public function querySurveyOrderDetail(string $surveyOrderId)
    {
        try {
            $xmlPayload = $this->buildRequestXml($surveyOrderId);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedXml = $this->parseResponseXml($xmlResponse);
            return ApiResponse::success($parsedXml);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::fromException($e, 'Query survey order failed.');
        }
    }

    /**
     * Build the SOAP XML request
     */
    protected function buildRequestXml(string $customerSurveyOrderId): string
    {
        $transactionId = uniqid();
        $config = config('services.ng');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://oss.huawei.com/webservice/bss/services" xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:QuerySurveyOrderDetailReqMsg>
         <ser:RequestHeader>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ChannelId>{$config['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$config['technical_channel_id']}</com:TechnicalChannelId>
            <com:AccessUser>{$config['access_user']}</com:AccessUser>
            <com:AccessPwd>{$config['access_pwd']}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:QuerySurveyOrderDetailReqBody>
            <com:CustomerSurveyOrderId>{$customerSurveyOrderId}</com:CustomerSurveyOrderId>
         </ser:QuerySurveyOrderDetailReqBody>
      </ser:QuerySurveyOrderDetailReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }


    private function parseResponseXml(string $xml)
    {
        $parsed = simplexml_load_string($xml);

        $namespaces = $parsed->getNamespaces(true);
        $body = $parsed->children($namespaces['soapenv'])->Body;
        $responseMsg = $body->children($namespaces['ser'])->QuerySurveyOrderDetailRspMsg;

        $responseHeader = $responseMsg->ResponseHeader->children($namespaces['com']);
        $responseBody = $responseMsg->QuerySurveyOrderDetailRespBody->children($namespaces['com']);

        $retCode = (string) $responseHeader->RetCode;
        $retMsg = (string) $responseHeader->RetMsg;

        if ($retCode !== '0') {
            return ApiResponse::error('Query survey order failed!');
        }

        $customerSurveyOrderId = (string) $responseBody->CustomerSurveyOrderId;

        $subOrders = [];
        $statuses = [];
        $surveyParams = []; // ExtParamList params for manual survey

        if (isset($responseBody->SubOrderList)) {
            foreach ($responseBody->SubOrderList->children($namespaces['com']) as $subOrder) {
                // Status is a numeric code matching FFDServiceProvisionStatus enum values
                $statusCode = (int) $subOrder->OrderStatus;

                $statuses[] = $statusCode;

                // Parse ExtParamList for survey details (critical for manual surveys)
                $extParams = [];
                if (isset($subOrder->ExtParamList)) {
                    foreach ($subOrder->ExtParamList->children($namespaces['com']) as $paramInfo) {
                        $paramCode = (string) $paramInfo->ParamCode;
                        $paramValue = (string) $paramInfo->ParamValue;
                        if ($paramCode !== '') {
                            $extParams[$paramCode] = $paramValue;
                        }
                    }
                }

                // Extract bandwidth from sub-order if present
                $bandwidth = (string) ($subOrder->bandwidth ?? '');

                $subOrders[] = [
                    'sub_survey_order_id' => (string) $subOrder->SubSurveyOrderId,
                    'order_type' => (string) $subOrder->OrderType,
                    'order_status' => $statusCode,
                    'primary_offer_id' => (string) $subOrder->PrimaryOfferid,
                    'telecom_region' => (string) $subOrder->TelecomRegion,
                    'contact_person' => (string) $subOrder->ContactPerson,
                    'contact_no' => (string) $subOrder->ContactNo,
                    'contact_email' => (string) $subOrder->ContactEmail,
                    'bandwidth' => $bandwidth,
                    'ext_params' => $extParams,
                ];

                // Merge ext_params into surveyParams (use first sub-order's params)
                if (empty($surveyParams) && !empty($extParams)) {
                    $surveyParams = $extParams;
                }
            }
        }

        /** 🔑 Compute MAIN survey order status from sub-order statuses */
        $mainStatus = $this->resolveSurveyOrderStatus($statuses);

        // Extract key survey result fields from ExtParamList
        // These are critical for device selection in manual surveys
        $surveyResult = $this->extractSurveyResultFields($surveyParams);

        return [
            'success' => true,
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => (string) $responseHeader->ResponseTime,
            'customer_survey_order_id' => $customerSurveyOrderId,
            'status' => $mainStatus,
            'sub_orders' => $subOrders,
            'survey_result' => $surveyResult,
        ];
    }

    /**
     * Extract key survey result fields from ExtParamList.
     *
     * Critical params for manual surveys (device selection):
     * - 50001: zone_name (e.g., "CAAZ", "NAAZ", "EAAZ") - used to lookup zone_code
     * - 50005: media_type (PON/COPPER, or -1 if survey failed)
     * - 50056: cable_type (0=copper, 1=fiber, 2=EPON, 3=GPON, 5=without survey)
     * - 50112: line_indicator (0=same line, 1=separate line)
     * - CauseContent: Failure reason when 50005 = -1 (e.g., "Need rehabilitation")
     * - 328: status indicator (1=created)
     *
     * Survey result logic:
     * - If 50005 = -1: Survey FAILED, extract CauseContent as failure reason
     * - If 50005 = PON/COPPER: Survey COMPLETED, proceed to device selection
     */
    private function extractSurveyResultFields(array $params): array
    {
        $mediaTypeRaw = $params['50005'] ?? null;
        $isSurveyFailed = $mediaTypeRaw === '-1' || $mediaTypeRaw === -1;

        // Extract failure reason from CauseContent when survey failed
        $failureReason = null;
        if ($isSurveyFailed) {
            $failureReason = $params['CauseContent'] ?? null;
            // Fallback: sometimes the reason might be empty, provide a default
            if (empty($failureReason)) {
                $failureReason = 'Survey failed - no specific reason provided';
            }
        }

        return [
            'zone_name' => $params['50001'] ?? null, // Zone name from BSS parameter 50001 (e.g., "CAAZ")
            'media_type' => $isSurveyFailed ? null : ($mediaTypeRaw ?? null),
            'cable_type' => isset($params['50056']) ? (int) $params['50056'] : null,
            'line_indicator' => isset($params['50112']) ? (int) $params['50112'] : 0,
            'survey_failed' => $isSurveyFailed,
            'survey_failure_reason' => $failureReason,
            'survey_status' => isset($params['328']) ? (int) $params['328'] : null,
            'survey_result_flag' => $params['SURVEY_RESULT'] ?? null,
        ];
    }

    /**
     * Resolve main survey order status from sub-order status codes.
     * 
     * Status codes match FFDServiceProvisionStatus enum:
     *   1 = Created, 2 = Ready, 3 = Suspended, 4 = Processing,
     *   5 = Cancelled, 6 = Waiting, 7 = Failed, 8 = Completed
     * 
     * Priority: Failed/Cancelled > Waiting/Processing/Created > Completed
     */
    private function resolveSurveyOrderStatus(array $statuses): int
    {
        if (empty($statuses)) {
            return FFDServiceProvisionStatus::Waiting->value;
        }

        // If any sub-order failed or cancelled, the main order is failed/cancelled
        if (in_array(FFDServiceProvisionStatus::Failed->value, $statuses, true)) {
            return FFDServiceProvisionStatus::Failed->value;
        }
        if (in_array(FFDServiceProvisionStatus::Cancelled->value, $statuses, true)) {
            return FFDServiceProvisionStatus::Cancelled->value;
        }

        // If any sub-order is still in progress (Created, Processing, Waiting, Suspended)
        $inProgressStatuses = [
            FFDServiceProvisionStatus::Created->value,
            FFDServiceProvisionStatus::Processing->value,
            FFDServiceProvisionStatus::Waiting->value,
            FFDServiceProvisionStatus::Suspended->value,
        ];
        foreach ($inProgressStatuses as $inProgress) {
            if (in_array($inProgress, $statuses, true)) {
                return $inProgress;
            }
        }

        // If all sub-orders are completed or ready
        if (in_array(FFDServiceProvisionStatus::Completed->value, $statuses, true)) {
            return FFDServiceProvisionStatus::Completed->value;
        }
        if (in_array(FFDServiceProvisionStatus::Ready->value, $statuses, true)) {
            return FFDServiceProvisionStatus::Ready->value;
        }

        // Fallback: return first status
        return $statuses[0];
    }
}
