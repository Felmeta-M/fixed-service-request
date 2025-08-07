<?php

use App\Http\Controllers\Api\BandwidthOptionController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\OccupationController;
use App\Http\Controllers\Api\SurveyController;
use App\Http\Controllers\Api\SurveyTypeController;
use App\Http\Controllers\Api\v1\LoginController;
use App\Http\Controllers\Api\v1\ServiceClientController;
use App\Http\Middleware\AuthenticateServiceClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');


Route::apiResource('survey-types', SurveyTypeController::class);
Route::apiResource('bandwidth-options', BandwidthOptionController::class);
Route::apiResource('occupations', OccupationController::class);

Route::prefix('v1')->group(function () {
    Route::post('/issueToken', [ServiceClientController::class, 'issueToken']);
});

Route::prefix('v1')->group(function () {
    Route::get('/customer', function (Request $request) {
        $user = $request->user();
        return [
            'code' => $user->code,
        ];
    })->middleware(AuthenticateServiceClient::class);
});

Route::prefix('locations')->group(function () {
    Route::get('/regions', [LocationController::class, 'regions']);
    Route::get('/zones/{regionId}', [LocationController::class, 'zones']);
    Route::get('/weredas/{zoneId}', [LocationController::class, 'weredas']);
});

Route::prefix('customer')->group(function () {
    // third party api
    Route::post('/create', [CustomerController::class, 'store']);
    Route::get('/query-by-service-number/{service_number}', [CustomerController::class, 'getCustomerByServiceNumber']);
    Route::get('/query-by-customer-code/{code}', [CustomerController::class, 'getCustomerByCode']);
    // local api
    Route::get('/types', [CustomerController::class, 'types']);
    Route::get('/categories', [CustomerController::class, 'categories']);
    Route::get('/subcategories', [CustomerController::class, 'subcategories']);
});

Route::prefix('survey')->group(function () {
    // third party api
    Route::post('/create', [SurveyController::class, 'store']);
});
Route::prefix('subscriber')->group(function () {});
Route::prefix('payment')->group(function () {});
