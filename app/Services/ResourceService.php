<?php

namespace App\Services;

use App\Enums\ErrorCode;
use App\Services\Logging\AppLogger;
use App\Support\CustomerContext;
use Illuminate\Support\Facades\Crypt;

class ResourceService extends BaseApiService
{
    protected int $timeout = 10;
    protected int $rateLimit = 100;

    public function __construct(
        protected readonly ZoneService $zoneService,
    ) {
    }

    protected function endpoint(): string
    {
        return config('services.check_resource.endpoint');
    }

    /**
     * Geo-fencing bounds for Addis Ababa, Ethiopia
     * Only coordinates within these bounds are allowed for automatic provisioning
     */
    private const ADDIS_ABABA_BOUNDS = [
        'latitude_min' => 8.8,
        'latitude_max' => 9.1,
        'longitude_min' => 38.6,
        'longitude_max' => 38.9,
    ];

    /**
     * Geo-fencing bounds for Ethiopia
     * Used to determine if location is in Ethiopia but outside Addis Ababa
     */
    private const ETHIOPIA_BOUNDS = [
        'latitude_min' => 3.4,
        'latitude_max' => 14.9,
        'longitude_min' => 32.9,
        'longitude_max' => 48.0,
    ];

    public function check(array $data)
    {
        try {
            // Validate coordinates are within Addis Ababa bounds
            $validationError = $this->validateCoordinates($data['latitude'] ?? null, $data['longitude'] ?? null);
            if ($validationError) {
                return $validationError;
            }

            $xmlPayload = $this->buildRequestXml($data);
            $xmlResponse = $this->executeRequest($xmlPayload);
            $parsedXml = $this->parseResponseXml($xmlResponse, $data);
            return $parsedXml;
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        } catch (\Throwable $e) {
            return ApiResponse::fromException($e, 'Resource check failed.');
        }
    }

    /**
     * Validate coordinates are within Addis Ababa, Ethiopia bounds
     * 
     * @param string|float|null $latitude The latitude value
     * @param string|float|null $longitude The longitude value
     * @return \Illuminate\Http\JsonResponse|null Returns error response if validation fails, null if valid
     */
    private function validateCoordinates($latitude, $longitude): ?\Illuminate\Http\JsonResponse
    {
        // Check if coordinates are provided
        if (empty($latitude) || empty($longitude)) {
            AppLogger::api()->warning('Resource check: Missing latitude or longitude', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'operation' => 'geo_fencing_validation',
            ]);
            return ApiResponse::error(
                'Latitude and longitude are required for resource checking.',
                ErrorCode::VALIDATION_ERROR,
                422
            );
        }

        // Convert to float for comparison
        $lat = (float) $latitude;
        $lng = (float) $longitude;

        // Validate numeric values
        if (!is_numeric($latitude) || !is_numeric($longitude)) {
            AppLogger::api()->warning('Resource check: Invalid coordinate format', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'operation' => 'geo_fencing_validation',
            ]);
            return ApiResponse::error(
                'Invalid latitude or longitude format. Please provide valid numeric coordinates.',
                ErrorCode::VALIDATION_ERROR,
                422
            );
        }

        // Check if coordinates are within Ethiopia bounds
        $ethiopiaBounds = self::ETHIOPIA_BOUNDS;
        $isWithinEthiopia = (
            $lat >= $ethiopiaBounds['latitude_min'] &&
            $lat <= $ethiopiaBounds['latitude_max'] &&
            $lng >= $ethiopiaBounds['longitude_min'] &&
            $lng <= $ethiopiaBounds['longitude_max']
        );

        if (!$isWithinEthiopia) {
            // Location is outside Ethiopia entirely
            AppLogger::api()->warning('Resource check: Coordinates outside Ethiopia bounds', [
                'latitude' => $lat,
                'longitude' => $lng,
                'operation' => 'geo_fencing_validation',
            ]);
            return ApiResponse::error(
                'No service provided outside Ethiopia. Please select a location within Ethiopia.',
                ErrorCode::VALIDATION_ERROR,
                422
            );
        }

        // Validation passed - coordinates are within Ethiopia
        // Resource availability will be checked in parseResponseXml
        return null;
    }

    protected function buildRequestXml(array $data): string
    {
        $transactionId = uniqid();
        $processTime = now()->format('YmdHis');
        $credentials = config('services.check_resource');

        $defaults = [
            'prod_spec_code' => 'C_P_UFBI_E',
            'number_line' => '1',
            'acc_nbr' => '-1',
            'event_code' => '101',
            'radius' => '200',
            'combo_flag' => '0',

            'cust_id' => $this->customerCode(),
            'cust_name' => $this->customerName(''),
            'cust_addr' => CustomerContext::addressString(''),
        ];

        $data = array_merge($defaults, $data);

        $custAddr = htmlspecialchars($data['cust_addr'], ENT_XML1 | ENT_QUOTES, 'UTF-8');
        $custName = htmlspecialchars($data['cust_name'], ENT_XML1 | ENT_QUOTES, 'UTF-8');

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
    <soapenv:Header>
        <typ:AuthenticationInfo xmlns:typ="http://oss.zsmart.ztesoft.com/om/webservice/types/">
            <UserName>{$credentials['access_user']}</UserName>
            <Password>{$credentials['access_pwd']}</Password>
            <TransactionId>{$transactionId}</TransactionId>
        </typ:AuthenticationInfo>
    </soapenv:Header>
    <soapenv:Body>
        <typ:resourceCheck xmlns:typ="http://oss.zsmart.ztesoft.com/om/webservice/types/">
            <PROD_SPEC_CODE>{$data['prod_spec_code']}</PROD_SPEC_CODE>
            <NUMBER_LINE>{$data['number_line']}</NUMBER_LINE>
            <ACC_NBR>{$data['acc_nbr']}</ACC_NBR>
            <EVENT_CODE>{$data['event_code']}</EVENT_CODE>
            <CUST_ID>{$data['cust_id']}</CUST_ID>
            <CUST_NAME>{$custName}</CUST_NAME>
            <CUST_ADDR>{$custAddr}</CUST_ADDR>
            <LONGITUDE>{$data['longitude']}</LONGITUDE>
            <LATITUDE>{$data['latitude']}</LATITUDE>
            <STAFF_CODE>{$credentials['staff_code']}</STAFF_CODE>
            <STAFF_NAME>{$credentials['staff_name']}</STAFF_NAME>
            <COMBO_FLAG>{$data['combo_flag']}</COMBO_FLAG>
            <TIMESTAMP>{$processTime}</TIMESTAMP>
            <BANDWIDTH>{$data['bandwidth']}</BANDWIDTH>
            <RADIUS>{$data['radius']}</RADIUS>
        </typ:resourceCheck>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }



    private function parseResponseXml(string $xml, array $data)
    {
        libxml_use_internal_errors(true);
        $parsed = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        // Step 2: Get namespaces
        $namespaces = $parsed->getNamespaces(true);

        // Step 3: Register namespaces for XPath
        $parsed->registerXPathNamespace('soapenv', $namespaces['soapenv'] ?? '');
        $parsed->registerXPathNamespace('ns1', $namespaces['ns1'] ?? '');

        // Step 4: Trace the SOAP Body
        $bodyNodes = $parsed->xpath('//soapenv:Body');
        if (empty($bodyNodes)) {
            AppLogger::api()->error('SOAP Body not found in resource check response', [
                'operation' => 'resource_check',
            ]);
            throw new \Exception('SOAP Body not found');
        }

        // Step 5: Trace ResourceCheckResponse
        $responses = $parsed->xpath('//soapenv:Body/ns1:ResourceCheckResponse');
        if (empty($responses)) {
            AppLogger::api()->error('ResourceCheckResponse not found in resource check response', [
                'operation' => 'resource_check',
            ]);
            throw new \Exception('ResourceCheckResponse not found');
        }
        $response = $responses[0];

        // Check result code
        $resultCode = (string) ($response->RESULT_CODE ?? '');
        $resultDesc = (string) ($response->RESULT_DESC ?? '');

        if ($resultCode !== '0') {
            AppLogger::api()->warning('Resource check returned error code', [
                'result_code' => $resultCode,
                'result_desc' => $resultDesc,
                'operation' => 'resource_check',
            ]);
        }

        // Step 6: Trace each RESOURCE element
        $resources = [];
        if (isset($response->RESOURCE_LIST->RESOURCE)) {
            foreach ($response->RESOURCE_LIST->RESOURCE as $i => $res) {
                $resources[] = [
                    'distance' => (string) $res->DISTANCE,
                    'ava_port' => (string) $res->AVAPORT,
                    'neid' => (string) $res->NEID,
                    'nename' => (string) $res->NENAME,
                    'typeid' => (string) $res->TYPEID,
                    'longitude' => (string) ($res->LONGITUDE ?? $data['longitude'] ?? ''),
                    'latitude' => (string) ($res->LATITUDE ?? $data['latitude'] ?? ''),
                    'cable_type' => (string) $res->CABLETYPE,
                    'cable_type_desc' => (string) $res->CABLETYPEDESC,
                    'area_code' => (string) ($res->AREACODE ?? ''),
                    'area_name' => (string) ($res->AREANAME ?? ''),
                ];
            }
        } else {
            AppLogger::api()->warning('No RESOURCE elements found in RESOURCE_LIST', [
                'operation' => 'resource_check',
            ]);
        }

        $shortestResource = $this->getShortestResource($resources);

        if (!$shortestResource) {
            return ApiResponse::error(
                'LOCATION_REVIEW_NEEDED: No resource found at this location. Please continue with manual request for review.',
                ErrorCode::VALIDATION_ERROR,
                422,
                [
                    'require_manual_survey' => true,
                    'longitude' => $data['longitude'] ?? null,
                    'latitude' => $data['latitude'] ?? null,
                ]
            );
        }

        $areaCode = $shortestResource['area_code_raw'] ?? null;
        $areaName = $shortestResource['area_name_raw'] ?? null;
        $zoneCode = $this->zoneService->getZoneCodeFromAreaCode($areaCode, $areaName);

        if (!$zoneCode) {
            return ApiResponse::error(
                'MANUAL_SURVEY_REQUIRED: Your location requires manual verification. Please submit a manual survey request.',
                ErrorCode::VALIDATION_ERROR,
                422,
                [
                    'require_manual_survey' => true,
                    'longitude' => $data['longitude'] ?? null,
                    'latitude' => $data['latitude'] ?? null,
                ]
            );
        }

        $shortestResource['zone_code'] = Crypt::encryptString($zoneCode);
        unset($shortestResource['area_code_raw'], $shortestResource['area_name_raw']);

        return ApiResponse::success($shortestResource, message: 'Resource found');
    }

    public function getShortestResource(array $resources): ?array
    {
        try {
            $resource = collect($resources)
                ->sortBy(fn($r) => $r['distance'])
                ->first();

            if (!$resource) {
                return null;
            }

            // Preserve raw values for zone lookup before encryption
            $resource['area_code_raw'] = (string) ($resource['area_code'] ?? '');
            $resource['area_name_raw'] = (string) ($resource['area_name'] ?? '');

            // Encrypt sensitive fields
            $resource['neid'] = Crypt::encryptString((string) $resource['neid']);
            $resource['distance'] = Crypt::encryptString((string) $resource['distance']);
            $resource['cable_type'] = Crypt::encryptString((string) $resource['cable_type']);
            $resource['longitude'] = Crypt::encryptString((string) $resource['longitude']);
            $resource['latitude'] = Crypt::encryptString((string) $resource['latitude']);
            $resource['area_code'] = Crypt::encryptString((string) ($resource['area_code'] ?? ''));
            $resource['area_name'] = Crypt::encryptString((string) ($resource['area_name'] ?? ''));

            return $resource;
        } catch (\Exception $e) {
            AppLogger::api()->exception($e, 'Failed to process resource', [
                'operation' => 'get_shortest_resource',
            ]);
            return null; // Or throw custom exception if needed
        }
    }

    private function emptyResource(array $data = []): array
    {
        return [
            'distance' => Crypt::encryptString((string) ($data['cable_type'] ?? '0')),
            'ava_port' => '',
            'neid' => Crypt::encryptString((string) ($data['longitude'] ?? '7000')),
            'nename' => '',
            'typeid' => '',
            'longitude' => Crypt::encryptString((string) ($data['longitude'] ?? '')),
            'latitude' => Crypt::encryptString((string) ($data['latitude'] ?? '')),
            'cable_type' => Crypt::encryptString((string) ($data['cable_type'] ?? '3')),
            'cable_type_desc' => '',
            'area_code' => Crypt::encryptString((string) ($data['area_code'] ?? '')),
            'area_name' => Crypt::encryptString((string) ($data['area_name'] ?? '')),
        ];
    }
}
