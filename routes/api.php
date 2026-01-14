<?php

use App\Http\Controllers\Api\v1\AccountController;
use App\Http\Controllers\Api\v1\AvailableDeviceController;
use App\Http\Controllers\Api\v1\AvailableNumberController;
use App\Http\Controllers\Api\v1\BandwidthOptionController;
use App\Http\Controllers\Api\v1\CancelSurveyOrderController;
use App\Http\Controllers\Api\v1\ChangeOfferController;
use App\Http\Controllers\Api\v1\CustomerController;
use App\Http\Controllers\Api\v1\EcafController;
use App\Http\Controllers\Api\v1\GetCombiningController;
use App\Http\Controllers\Api\v1\LocationController;
use App\Http\Controllers\Api\v1\OccupationController;
use App\Http\Controllers\Api\v1\OneOffFeeController;
use App\Http\Controllers\Api\v1\PaymentController;
use App\Http\Controllers\Api\v1\PrimaryOfferingController;
use App\Http\Controllers\Api\v1\QuerySurveyOrderController;
use App\Http\Controllers\Api\v1\QuerySurveyOrderSummaryController;
use App\Http\Controllers\Api\v1\ReserveNumberServiceController;
use App\Http\Controllers\Api\v1\ResourceCheckController;
use App\Http\Controllers\Api\v1\ServiceClientController;
use App\Http\Controllers\Api\v1\SubsriptionController;
use App\Http\Controllers\Api\v1\SurveyOrderController;
use App\Http\Controllers\Api\v1\SurveyTypeController;
use App\Http\Controllers\Api\v1\TelebirrController;
use App\Http\Controllers\Api\v1\TelecomRegionController;
use App\Http\Controllers\Api\v1\TroubleTicketController;
use App\Http\Controllers\Api\v1\SubscriptionOrderStatusController;
use App\Http\Controllers\Api\v1\PurchasedOfferingController;
use App\Http\Controllers\Api\v1\ChangePrimaryOfferingController;
use App\Http\Middleware\AuthenticateServiceClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::prefix('v1')->group(function () {

    // Token endpoints with strict rate limiting
    Route::middleware(['throttle:service_client'])->group(function () {
        Route::post('/issue-token', [ServiceClientController::class, 'issueToken']);
        Route::get('/fetch-token', function (Request $request) {
            $user = $request->user();
            return [
                'code' => $user->code,
            ];
        })->middleware(AuthenticateServiceClient::class);
    });

    // Public read-only endpoints with moderate rate limiting
    Route::middleware(['throttle:api_public'])->group(function () {
        Route::apiResource('survey-types', SurveyTypeController::class);
        Route::apiResource('bandwidth-options', BandwidthOptionController::class);
        Route::apiResource('occupations', OccupationController::class);
        Route::get('available-devices', [AvailableDeviceController::class, 'index']);
        Route::get('available-devices/{id}', [AvailableDeviceController::class, 'show']);

        Route::prefix('locations')->group(function () {
            Route::get('/regions', [LocationController::class, 'regions']);
            Route::get('/zones/{regionId}', [LocationController::class, 'zones'])->where('regionId', '[0-9]+');
            Route::get('/weredas/{zoneId}', [LocationController::class, 'weredas'])->where('zoneId', '[0-9]+');
        });

        // Telecom regions for manual survey dropdown
        Route::get('telecom-regions', [TelecomRegionController::class, 'index']);
        Route::get('telecom-regions/show', [TelecomRegionController::class, 'show']);
    });

    Route::middleware(['auth:api'])->group(function () {

        // Heavy operations: Customer creation and ECAF upload
        Route::middleware(['throttle:api_heavy'])->group(function () {
            Route::prefix('customer')->group(function () {
                Route::post('/create', [CustomerController::class, 'store']);
                Route::post('/ecaf', [EcafController::class, 'upload']);
            });

            Route::post('ecaf-upload', [EcafController::class, 'upload']);

            Route::prefix('survey')->group(function () {
                Route::post('/create', [SurveyOrderController::class, 'store']);
                Route::post('/create-manual', [SurveyOrderController::class, 'storeManual']);
            });
        });

        // General authenticated endpoints: Customer queries and read operations
        Route::middleware(['throttle:api_authenticated'])->group(function () {
            Route::prefix('customer')->group(function () {
                Route::get('/', [CustomerController::class, 'show']);
                Route::post('/query-by-service-number', [CustomerController::class, 'getCustomerByServiceNumber']);
                Route::post('/query-by-customer-code', [CustomerController::class, 'getCustomerByCode']);
                Route::get('/types', [CustomerController::class, 'types']);
                Route::get('/categories', [CustomerController::class, 'categories']);
                Route::get('/subcategories', [CustomerController::class, 'subcategories']);
            });

            Route::prefix('survey')->group(function () {
                Route::post('/order', [QuerySurveyOrderController::class, 'querySurveyOrder']);
                Route::post('/order-summary', [QuerySurveyOrderSummaryController::class, 'querySurveyOrderSummary']);
            });

            Route::get('survey-requests', [SurveyOrderController::class, 'index']);
            Route::get('survey-requests/show', [SurveyOrderController::class, 'show']);
            Route::patch('survey-requests/update', [SurveyOrderController::class, 'update']);
            Route::delete('survey-requests/delete', [SurveyOrderController::class, 'destroy']);

            Route::post('account-list', [AccountController::class, 'getAccount']);
            Route::post('primary-offers', [PrimaryOfferingController::class, 'getPrimaryOffer']);
            Route::post('change-offer', [ChangeOfferController::class, 'changePrimaryOffering']);
            Route::post('avaiable-number', [AvailableNumberController::class, 'getAvaiableNumber']);
            Route::post('cancel-survey-order', [CancelSurveyOrderController::class, 'cancel']);
            Route::post('resource-check', [ResourceCheckController::class, 'check']);
            Route::post('release-number-service', [ReserveNumberServiceController::class, 'release']);

            Route::post('calc-one-off-fee', [OneOffFeeController::class, 'calculateOneOffFee']);
            Route::post('one-off-fee', [OneOffFeeController::class, 'fee']);

            Route::get('payments/show', [PaymentController::class, 'show']);

            // Subscription order status queries
            Route::post('subscription-order-status', [SubscriptionOrderStatusController::class, 'query']);
            Route::get('subscription-order-status/labels', [SubscriptionOrderStatusController::class, 'statusLabels']);

            // Purchased offering queries
            Route::post('purchased-offering', [PurchasedOfferingController::class, 'query']);
            Route::post('purchased-offering/by-service-number', [PurchasedOfferingController::class, 'queryByServiceNumber']);
            Route::get('purchased-offering/object-types', [PurchasedOfferingController::class, 'objectTypes']);

            // Change primary offering (bandwidth/plan upgrade/downgrade)
            Route::post('change-primary-offering', [ChangePrimaryOfferingController::class, 'change']);
            Route::post('change-bandwidth', [ChangePrimaryOfferingController::class, 'changeBandwidth']);
            Route::get('change-primary-offering/object-types', [ChangePrimaryOfferingController::class, 'objectTypes']);
        });

        // Critical operations: Payments, orders, subscriptions
        Route::middleware(['throttle:api_critical'])->group(function () {
            Route::prefix('services')->group(function () {
                Route::post('/subscription', [SubsriptionController::class, 'store']);
            });

            Route::post('create-order', [TelebirrController::class, 'createOrder'])->name('create.order');
        });

        // Trouble ticket operations
        Route::middleware(['throttle:api_trouble_tickets'])->group(function () {
            Route::get('trouble-tickets', [TroubleTicketController::class, 'index']);
            Route::get('trouble-tickets/{tt_serial_no}', [TroubleTicketController::class, 'show']);
            Route::post('tt/create', [TroubleTicketController::class, 'store']);
            Route::post('tt/query', [TroubleTicketController::class, 'query']);
            Route::post('tt/detail', [TroubleTicketController::class, 'detail']);
            Route::post('tt/confirm-feedback', [TroubleTicketController::class, 'confirm']);
        });
    });
});
