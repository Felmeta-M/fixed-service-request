<?php

use App\Http\Controllers\Api\v1\BandwidthOptionController;
use App\Http\Controllers\Api\v1\CustomerController;
use App\Http\Controllers\Api\v1\EcafController;
use App\Http\Controllers\Api\v1\LocationController;
use App\Http\Controllers\Api\v1\NidController;
use App\Http\Controllers\Api\v1\OccupationController;
use App\Http\Controllers\Api\v1\SurveyController;
use App\Http\Controllers\Api\v1\SurveyTypeController;
use App\Http\Controllers\Api\v1\ServiceClientController;
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
        Route::get('/query-by-service-number/{service_number}', [CustomerController::class, 'getCustomerByServiceNumber']);
        Route::get('/query-by-customer-code/{code}', [CustomerController::class, 'getCustomerByCode']);
        Route::get('/types', [CustomerController::class, 'types']);
        Route::get('/categories', [CustomerController::class, 'categories']);
        Route::get('/subcategories', [CustomerController::class, 'subcategories']);
    });

    Route::prefix('survey')->group(function () {
        Route::post('/create', [SurveyController::class, 'store']);
    });
    Route::prefix('subscriber')->group(function () {});
    Route::prefix('payment')->group(function () {});
    Route::prefix('nid')->group(function () {
        Route::post('otp', [NidController::class, 'getOtp']);
        Route::post('kyc', [NidController::class, 'getKyc']);
    });
});
