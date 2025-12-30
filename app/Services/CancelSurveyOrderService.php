<?php

namespace App\Services;

use App\Enums\FFDServiceProvisionStatus;
use App\Models\SurveyOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class CancelSurveyOrderService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    public function __construct(protected readonly ReserveNumberService $reserveNumberService,) {}

    protected function endpoint(): string
    {
        return config('services.cancel_survey.endpoint');
    }

    public function cancelSurveyOrder(array $data): JsonResponse
    {
        try {
            $customer = auth()->user();
            $order = SurveyOrder::where([
                'customer_survey_order_id' =>  $data['customer_survey_order_id'],
                'customer_code' => $customer->customer_code,
            ])->first();

            if (! $order) {
                return ApiResponse::error(message: 'Survey order not found.');
            }

            /**
             * 🚫 Cancel only if status = WAITING
             */

            if (!in_array($order->status, FFDServiceProvisionStatus::canCancelSurveyOrder())) {
                return ApiResponse::error(message: 'Only waiting survey orders can be cancelled.');
            }

            $xmlPayload = $this->buildXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            return $this->parseResponse($data, $xmlResponse);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::exception($e, 'Cancel survey order failed.');
        }
    }

    protected function buildXml(array $data): string
    {
        $transactionId = uniqid();
        $processTime   = now()->format('YmdHis');
        $config = config('services.cancel_survey');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://oss.huawei.com/webservice/bss/services"
                  xmlns:com="http://www.huawei.com/bss/soaif/interface/common/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:CancelSurveyOrderReqMsg>
         <ser:RequestHeader>
            <com:Version>1</com:Version>
            <com:TransactionId>{$transactionId}</com:TransactionId>
            <com:ProcessTime>{$processTime}</com:ProcessTime>
            <com:ChannelId>{$config['channel_id']}</com:ChannelId>
            <com:TechnicalChannelId>{$config['tech_channel_id']}</com:TechnicalChannelId>
            <com:AccessUser>{$config['access_user']}</com:AccessUser>
            <com:AccessPwd>{$config['access_pwd']}</com:AccessPwd>
         </ser:RequestHeader>
         <ser:CancelSurveyOrderRequestBody>
            <com:CustomerSurveyOrderId>{$data['customer_survey_order_id']}</com:CustomerSurveyOrderId>
         </ser:CancelSurveyOrderRequestBody>
      </ser:CancelSurveyOrderReqMsg>
   </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    protected function parseResponse(array $data, string $xml): JsonResponse
    {
        $xmlObject  = simplexml_load_string($xml);

        if ($xmlObject === false) {
            return ApiResponse::error("Invalid XML response for cancel survey order");
        }

        $namespaces = $xmlObject->getNamespaces(true);
        $body = $xmlObject->children($namespaces['soapenv'])->Body;
        $response = $body->children($namespaces['ser'])->CancelSurveyOrderRspMsg;
        $header = $response->ResponseHeader->children($namespaces['com']);
        $retCode = (string) $header->RetCode;
        $retMsg  = (string) $header->RetMsg;
        $responseTime = (string) $header->ResponseTime;

        if ($retCode !== '0') {
            return ApiResponse::error($retMsg);
        }

        $surveyOrder = SurveyOrder::where(
            'customer_survey_order_id',
            $data['customer_survey_order_id']
        )->first();

        if ($surveyOrder) {
            /**
             * Release reserved service number BEFORE deleting
             */
            if ($surveyOrder->service_number) {
                try {
                    $this->reserveNumberService->unpick([
                        'res_type_id' => 10,
                        'oper_type'   => 1030,
                        'res_code'    => $surveyOrder->service_number,
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Failed to release service number', [
                        'service_number' => $surveyOrder->service_number,
                        'survey_order_id' => $surveyOrder->id,
                        'error' => $e->getMessage(),
                    ]);

                    // Decide if delete should stop or continue
                    // return; // ← uncomment if you want to stop deletion
                }
            }
            /**
             * Optional: log cancellation before delete
             */
        // Log::info('Survey order force deleted', [
        //     'survey_order_id' => $surveyOrder->id,
        //     'customer_survey_order_id' => $surveyOrder->customer_survey_order_id,
        //     'cancel_reason' => $data['cancel_reason'] ?? null,
        // ]);

            /**
             * Force delete (permanent)
             */
            $surveyOrder->forceDelete();
        }


        $bodyData = $response->CancelSurveyOrderRequestBody ?? null;

        return ApiResponse::success([
            'ResponseTime' => $responseTime,
            'RetCode'      => $retCode,
            'RetMsg'       => $retMsg,
            'Body'         => $bodyData,
        ]);
    }
}
