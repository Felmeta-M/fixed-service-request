<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use SimpleXMLElement;
use Illuminate\Support\Str;

class OneOffFeeService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 15;

    protected function endpoint(): string
    {
        return config('services.one_off_fee.endpoint');
    }

    public function calculateOneOffFee(array $data)
    {
        try {
            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedXml = $this->parseResponseXml($xmlResponse);
            return ApiResponse::success($parsedXml);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::exception($e, 'One off fee xml request failed.');
        }
    }
    /**
     * Build the SOAP XML request.
     */
    protected function buildRequestXml(array $data): string
    {
        $transactionId = uniqid();
        $processTime = now()->format('YmdHis');
        $credentials = config('services.one_off_fee');

        return <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:com="http://www.huawei.com/bss/soaif/interface/common/"
                  xmlns:ser="http://oss.huawei.com/webservice/bss/services">
    <soapenv:Header/>
    <soapenv:Body>
        <ser:CalcOneOffFeeReqMsg>
            <ser:RequestHeader>
                <com:Version>{$credentials['version']}</com:Version>
                <com:TransactionId>{$transactionId}</com:TransactionId>
                <com:ProcessTime>{$processTime}</com:ProcessTime>
                <com:Language>{$credentials['language']}</com:Language>
                <com:ChannelId>{$credentials['channel_id']}</com:ChannelId>
                <com:TechnicalChannelId>{$credentials['technical_channel_id']}</com:TechnicalChannelId>
                <com:TenantId>{$credentials['tenant_id']}</com:TenantId>
                <com:AccessUser>{$credentials['access_user']}</com:AccessUser>
                <com:AccessPwd>{$credentials['access_pwd']}</com:AccessPwd>
            </ser:RequestHeader>
            <ser:CalcOneOffFeeReqBody>
                <com:BusinessCode>{$data['business_code']}</com:BusinessCode>
                <com:CustomerBusiOrder>
                    <com:CustomerInfo>
                        <com:CustomerType>{$data['customer']['type']}</com:CustomerType>
                        <com:CustomerCategory>{$data['customer']['category']}</com:CustomerCategory>
                        <com:CustomerSubcategory>{$data['customer']['subcategory']}</com:CustomerSubcategory>
                        <com:CustomerLevel>{$data['customer']['level']}</com:CustomerLevel>
                        <com:Nationality>{$data['customer']['nationality']}</com:Nationality>
                        <com:IdentificationType>{$data['customer']['id_type']}</com:IdentificationType>
                    </com:CustomerInfo>
                </com:CustomerBusiOrder>
                <com:SubBusiOrderList>
                    <com:SubBusiOrder>
                        <com:BusinessCode>{$data['sub_order']['business_code']}</com:BusinessCode>
                        <com:SubscriberInfo>
                            <com:ExternalSequnce>{$data['sub_order']['external_sequence']}</com:ExternalSequnce>
                            <com:ServiceNumber>{$data['sub_order']['service_number']}</com:ServiceNumber>
                            <com:NetworkType>{$data['sub_order']['network_type']}</com:NetworkType>
                            <com:SubType>{$data['sub_order']['sub_type']}</com:SubType>
                            <com:PrimaryOffering>
                                <com:NewPrimaryOffering>
                                    <com:OfferingId>
                                        <com:OfferingId>{$data['sub_order']['offering_id']}</com:OfferingId>
                                    </com:OfferingId>
                                </com:NewPrimaryOffering>
                                <com:EffectiveMode>0</com:EffectiveMode>
                            </com:PrimaryOffering>
                            <com:SLAPriority>4</com:SLAPriority>
                            <com:CallCenterAccess>4</com:CallCenterAccess>
                        </com:SubscriberInfo>
                    </com:SubBusiOrder>
                </com:SubBusiOrderList>
            </ser:CalcOneOffFeeReqBody>
        </ser:CalcOneOffFeeReqMsg>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    /**
     * Parse SOAP XML response into array.
     */
    protected function parseResponseXml(string $xml): array
    {
        $xmlObject = simplexml_load_string($xml);

        if ($xmlObject === false) {
            return [];
        }

        // Register namespaces
        $namespaces = $xmlObject->getNamespaces(true);

        // Navigate into the SOAP body
        $body = $xmlObject->children($namespaces['soapenv'])->Body;

        // Inside Body → CalcOneOffFeeRspMsg
        $response = $body->children($namespaces['ser'])->CalcOneOffFeeRspMsg;

        // Response Header
        $header = $response->children($namespaces['ser'])->ResponseHeader->children($namespaces['com']);

        $parsed = [
            // 'response_header' => [
            //     'response_time' => (string) $header->ResponseTime,
            //     'ret_code'      => (string) $header->RetCode,
            //     'ret_msg'       => (string) $header->RetMsg,
            // ],
            'fees' => [],
        ];

        // Response Body
        $respBody = $response->children($namespaces['ser'])->CalcOneOffFeeRespBody;
        $subBusiList = $respBody->children($namespaces['com'])->SubBusifeelist;

        // $parsed['external_sequence'] = (string) $subBusiList->ExternalSequnce;

        // Loop SubBusifee list
        foreach ($subBusiList->SubBusifee as $fee) {
            $feeChildren = $fee->children($namespaces['com']);

            $taxes = [];
            foreach ($feeChildren->TaxInfo as $tax) {
                $taxChildren = $tax->children($namespaces['com']);
                $taxes[] = [
                    'code'  => (string) $taxChildren->TaxCode,
                    'name'  => (string) $taxChildren->TaxName,
                    'fee'   => (string) $taxChildren->TaxFee,
                    'rate'  => (string) $taxChildren->TaxRate,
                ];
            }

            $extParams = [];
            foreach ($feeChildren->ExtParamList->ParameterInfo as $param) {
                $paramChildren = $param->children($namespaces['com']);
                $extParams[(string) $paramChildren->ParamName] = (string) $paramChildren->ParamValue;
            }

            $parsed['fees'][] = [
                // 'item_code'      => (string) $feeChildren->FeeItemCode,
                'item_name'      => (string) $feeChildren->FeeItemName,
                // 'fee_type'       => (string) $feeChildren->FeeType,
                // 'currency_id'    => (string) $feeChildren->CurrencyID,
                'calculated_fee' => (string) $feeChildren->CaculatedFee,
                'original_fee'   => (string) $feeChildren->OriginalFee,
                'discount_fee'   => (string) $feeChildren->DiscountFee,
                // 'pay_type'       => (string) $feeChildren->PayType,
                'taxes'          => $taxes,
                // 'ext_params'     => $extParams,
            ];
        }

        return $parsed;
    }
}
