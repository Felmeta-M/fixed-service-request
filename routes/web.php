<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\PrimaryOfferingController;
use App\Http\Controllers\ResourceCheckController;
use App\Http\Controllers\SubscriberController;
use App\Http\Controllers\SurveyRequestController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route::get('/', function () {
//     return Inertia::render('welcome');
// })->name('home');


Route::get('/', function () {
    return Inertia::render('LandingPage');
})->name('landing');

Route::get('/welcome', function () {
    return Inertia::render('auth/otp-login');
})->name('home');

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

    // Route::resource('customers', CustomerController::class);
    // Route::resource('survey-requests', SurveyRequestController::class);
    Route::resource('subscribers', SubscriberController::class);
    Route::resource('resource-checks', ResourceCheckController::class);

    Route::prefix('primary-offerings')->group(function () {
        Route::get('/', [PrimaryOfferingController::class, 'index'])->name('offerings.index');
        Route::post('/', [PrimaryOfferingController::class, 'store'])->name('offerings.store');
        Route::get('/{objectId}', [PrimaryOfferingController::class, 'show'])->name('offerings.show');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
