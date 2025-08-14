<?php

use App\Http\Controllers\Auth\ClientAuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ResourceCheckController;
use App\Http\Controllers\SubscriberController;
use App\Http\Controllers\SurveyRequestController;
use App\Models\Customer;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route::get('/', function () {
//     return Inertia::render('auth/otp-login');
// })->name('home');
// Route::get('/customer-portal', [CustomerController::class, 'portal'])->name('customer.portal');
// routes/web.php
Route::get('/customer/portal', [CustomerController::class, 'portal'])
    ->name('customer.portal');


Route::get('/', function () {
    return Inertia::render('LandingPage');
})->name('landing');

Route::get('/verification', function () {
    return Inertia::render('client/login');
})->name('home');


Route::middleware(['auth:client'])->group(function () {
    Route::get('/clients', fn() => Inertia::render('client/dashboard'))
        ->name('client.dashboard');
});

// Service request routes
// Route::middleware(['auth:customer'])->group(function () {
Route::get('/survey-requests/selection', [SurveyRequestController::class, 'selection'])
    ->name('survey-requests.selection');

// Service request creation with type parameter
Route::get('/survey-requests/create/{type}', [SurveyRequestController::class, 'create'])
    ->where('type', 'fl|fbb|combo|home|business') // Validate type
    ->name('survey-requests.create');


Route::post('/survey-requests', [SurveyRequestController::class, 'store'])
    ->name('survey-requests.store');

Route::get('/survey-requests/confirmation', [SurveyRequestController::class, 'confirmation'])
    ->name('survey-requests.confirmation');
// });

// Route::get('/', function () {
//     return Inertia::render('welcome');
// })->name('home');

// Route::resource('customers', CustomerController::class);
// Route::resource('survey-requests', SurveyRequestController::class);

// Route::resource('customers', CustomerController::class);
// Route::get('customers/{customer}/success', [CustomerController::class, 'success'])
//     ->name('customers.success');

// Keep the resource route
Route::resource('customers', CustomerController::class)->except(['create', 'store', 'success']);

// Add custom create/store routes
Route::get('/create-customer', [CustomerController::class, 'create'])->name('customers.create');
Route::post('/create-customer', [CustomerController::class, 'store'])->name('customers.store');
// Other routes remain the same
Route::get('/customer-{customer}/success', [CustomerController::class, 'success'])->name('customers.success');

Route::resource('survey-requests', SurveyRequestController::class);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');


    Route::resource('subscribers', SubscriberController::class);
    Route::resource('resource-checks', ResourceCheckController::class);
});

Route::prefix('client')->group(function () {
    Route::post('/send-otp', [ClientAuthController::class, 'sendOneTimePassword'])->name('sendOtp');
    Route::post('/verify-otp', [ClientAuthController::class, 'verifyOneTimePassword'])->name('verifyOtp');
    Route::post('/login', [ClientAuthController::class, 'login'])->name('client.session.login');
    Route::post('/logout', [ClientAuthController::class, 'logout'])->name('client.session.logout');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
