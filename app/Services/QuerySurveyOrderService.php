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
                $status = strtolower((string) $subOrder->OrderStatus);

                $statuses[] = $status;

                $subOrders[] = [
                    'sub_survey_order_id' => (string) $subOrder->SubSurveyOrderId,
                    'order_type'          => (string) $subOrder->OrderType,
                    'order_status'        => $status,
                    'primary_offer_id'    => (string) $subOrder->PrimaryOfferid,
                    'telecom_region'      => (string) $subOrder->TelecomRegion,
                    'contact_person'      => (string) $subOrder->ContactPerson,
                    'contact_no'          => (string) $subOrder->ContactNo,
                    'contact_email'       => (string) $subOrder->ContactEmail,
                ];
            }
        }

        /** 🔑 Compute MAIN survey order status */
        $mainStatus = $this->resolveSurveyOrderStatus($statuses);

        return [
            'success' => true,
            'ret_code' => $retCode,
            'ret_msg' => $retMsg,
            'response_time' => (string) $responseHeader->ResponseTime,
            'customer_survey_order_id' => $customerSurveyOrderId,
            'status' => $mainStatus,           // ✅ IMPORTANT
            'sub_orders' => $subOrders,
        ];
    }

    private function resolveSurveyOrderStatus(array $statuses): string
    {
        if (empty($statuses)) {
            return FFDServiceProvisionStatus::Waiting->value;
        }

        if (in_array('waiting', $statuses, true)) {
            return FFDServiceProvisionStatus::Waiting->value;
        }

        if (in_array('failed', $statuses, true) || in_array('rejected', $statuses, true)) {
            return FFDServiceProvisionStatus::Failed->value;
        }

        return FFDServiceProvisionStatus::Completed->value;
    }
}
