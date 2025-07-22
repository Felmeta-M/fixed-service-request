<?php

use App\Http\Controllers\Api\BandwidthOptionController;
use App\Http\Controllers\Api\OccupationController;
use App\Http\Controllers\Api\SurveyTypeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::apiResource('survey-types', SurveyTypeController::class);
Route::apiResource('bandwidth-optins', BandwidthOptionController::class);
Route::apiResource('occupations', OccupationController::class);
