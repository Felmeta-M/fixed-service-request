<?php

use App\Http\Controllers\Api\BandwidthOptionController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\OccupationController;
use App\Http\Controllers\Api\SurveyTypeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');


Route::apiResource('survey-types', SurveyTypeController::class);
Route::apiResource('bandwidth-options', BandwidthOptionController::class);
Route::apiResource('occupations', OccupationController::class);


Route::prefix('customer')->group(function () {
    Route::post('/create', [CustomerController::class, 'store']);
    Route::get('/types', [CustomerController::class, 'types']);
    Route::get('/categories', [CustomerController::class, 'categories']);
    Route::get('/subcategories', [CustomerController::class, 'subcategories']);
    Route::get('/query-by-service-number/{service_number}', [CustomerController::class, 'getCustomerByServiceNumber']);
    Route::get('/query-by-customer-code/{code}', [CustomerController::class, 'getCustomerByCode']);
});

Route::prefix('survey')->group(function () {});
Route::prefix('subscriber')->group(function () {});
Route::prefix('payment')->group(function () {});
