<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;

class QuerySurveyOrderService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.query_survey.endpoint');
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
            return ApiResponse::exception($e, 'Query survey order failed.');
        }
    }

    /**
     * Build the SOAP XML request
     */
    protected function buildRequestXml(string $customerSurveyOrderId): string
    {
        $transactionId = uniqid();
        $config = config('services.query_survey');

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
        $responseBody   = $responseMsg->QuerySurveyOrderDetailRespBody->children($namespaces['com']);

        $retCode = (string) $responseHeader->RetCode;
        $retMsg  = (string) $responseHeader->RetMsg;

        if ($retCode !== '0') {
            return ApiResponse::error('Query survey order failed!');
        }

        $customerSurveyOrderId = (string) $responseBody->CustomerSurveyOrderId;

        $subOrders = [];
        $statuses  = [];

        if (isset($responseBody->SubOrderList)) {
            foreach ($responseBody->SubOrderList->children($namespaces['com']) as $subOrder) {
                // Status is a numeric code matching FFDServiceProvisionStatus enum values
                $statusCode = (int) $subOrder->OrderStatus;

                $statuses[] = $statusCode;

                $subOrders[] = [
                    'sub_survey_order_id' => (string) $subOrder->SubSurveyOrderId,
                    'order_type'          => (string) $subOrder->OrderType,
                    'order_status'        => $statusCode,
                    'primary_offer_id'    => (string) $subOrder->PrimaryOfferid,
                    'telecom_region'      => (string) $subOrder->TelecomRegion,
                    'contact_person'      => (string) $subOrder->ContactPerson,
                    'contact_no'          => (string) $subOrder->ContactNo,
                    'contact_email'       => (string) $subOrder->ContactEmail,
                ];
            }
        }

        /** 🔑 Compute MAIN survey order status from sub-order statuses */
        $mainStatus = $this->resolveSurveyOrderStatus($statuses);

        return [
            'success' => true,
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => (string) $responseHeader->ResponseTime,
            'customer_survey_order_id' => $customerSurveyOrderId,
            'status' => $mainStatus,
            'sub_orders' => $subOrders,
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
