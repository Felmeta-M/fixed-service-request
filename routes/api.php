<?php

use App\Http\Controllers\Api\v1\AccountController;
use App\Http\Controllers\Api\v1\AvailableNumberController;
use App\Http\Controllers\Api\v1\BandwidthOptionController;
use App\Http\Controllers\Api\v1\CancelSurveyOrderController;
use App\Http\Controllers\Api\v1\CustomerController;
use App\Http\Controllers\Api\v1\EcafController;
use App\Http\Controllers\Api\v1\LocationController;
use App\Http\Controllers\Api\v1\NidController;
use App\Http\Controllers\Api\v1\OccupationController;
use App\Http\Controllers\Api\v1\PrimaryOfferingController;
use App\Http\Controllers\Api\v1\QuerySurveyOrderController;
use App\Http\Controllers\Api\v1\QuerySurveyOrderSummaryController;
use App\Http\Controllers\Api\v1\ResourceCheckController;
use App\Http\Controllers\Api\v1\SurveyController;
use App\Http\Controllers\Api\v1\SurveyTypeController;
use App\Http\Controllers\Api\v1\ServiceClientController;
use App\Http\Controllers\Api\v1\SubsriptionController;
use App\Http\Middleware\AuthenticateServiceClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::middleware(['throttle:service_client'])->group(function () {
        Route::post('/issue-token', [ServiceClientController::class, 'issueToken']);
        Route::get('/fetch-token', function (Request $request) {
            $user = $request->user();
            return [
                'code' => $user->code,
            ];
        })->middleware(AuthenticateServiceClient::class);
    });

    Route::apiResource('survey-types', SurveyTypeController::class);
    Route::apiResource('bandwidth-options', BandwidthOptionController::class);
    Route::apiResource('occupations', OccupationController::class);

    Route::prefix('locations')->group(function () {
        Route::get('/regions', [LocationController::class, 'regions']);
        Route::get('/zones/{regionId}', [LocationController::class, 'zones']);
        Route::get('/weredas/{zoneId}', [LocationController::class, 'weredas']);
    });

    Route::prefix('customer')->group(function () {
        Route::post('/create', [CustomerController::class, 'store']);
        Route::post('/ecaf', [EcafController::class, 'upload']);
        Route::post('/query-by-service-number', [CustomerController::class, 'getCustomerByServiceNumber']);
        Route::post('/query-by-customer-code', [CustomerController::class, 'getCustomerByCode']);
        Route::get('/types', [CustomerController::class, 'types']);
        Route::get('/categories', [CustomerController::class, 'categories']);
        Route::get('/subcategories', [CustomerController::class, 'subcategories']);
    });

    Route::prefix('survey')->group(function () {
        Route::post('/create', [SurveyController::class, 'store']);
        Route::post('/order', [QuerySurveyOrderController::class, 'querySurveyOrder']);
        Route::post('/order-summary', [QuerySurveyOrderSummaryController::class, 'querySurveyOrderSummary']);
    });

    Route::prefix('services')->group(function () {
        Route::post('/subscription', [SubsriptionController::class, 'store']);
    });

    Route::prefix('payment')->group(function () {});

    Route::prefix('nid')->group(function () {
        Route::post('otp', [NidController::class, 'getOtp']);
        Route::post('kyc', [NidController::class, 'getKyc']);
    });

    Route::post('account-list', [AccountController::class, 'getAccount']);
    Route::post('primary-offers', [PrimaryOfferingController::class, 'getPrimaryOffer']);
    Route::post('avaiable-number', [AvailableNumberController::class, 'getAvaiableNumber']);
    Route::post('cancel-survey-order', [CancelSurveyOrderController::class, 'cancel']);
    Route::post('resource-check', [ResourceCheckController::class, 'check']);
});
