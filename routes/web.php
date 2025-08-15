<?php

// use App\Http\Controllers\Auth\ClientAuthController;
// use App\Http\Controllers\CustomerController;
// use App\Http\Controllers\ResourceCheckController;
// use App\Http\Controllers\SubscriberController;
// use App\Http\Controllers\SurveyRequestController;
// use App\Models\Customer;
// use Illuminate\Support\Facades\Route;
// use Inertia\Inertia;

// Route::get('/customer/portal', [CustomerController::class, 'portal'])
//     ->name('customer.portal');


// Route::get('/', function () {
//     return Inertia::render('LandingPage');
// })->name('landing');

// Route::get('/verification', function () {
//     return Inertia::render('client/login');
// })->name('home');


// Route::middleware(['auth:client'])->group(function () {
//     Route::get('/clients', fn() => Inertia::render('client/dashboard'))
//         ->name('client.dashboard');
// });

// Route::get('/survey-requests/selection', [SurveyRequestController::class, 'selection'])
//     ->name('survey-requests.selection');

// Route::get('/survey-requests/create/{type}', [SurveyRequestController::class, 'create'])
//     ->where('type', 'fl|fbb|combo|home|business') // Validate type
//     ->name('survey-requests.create');


// Route::post('/survey-requests', [SurveyRequestController::class, 'store'])
//     ->name('survey-requests.store');

// Route::get('/survey-requests/confirmation', [SurveyRequestController::class, 'confirmation'])
//     ->name('survey-requests.confirmation');

// Route::resource('customers', CustomerController::class)->except(['create', 'store', 'success']);

// Route::get('/create-customer', [CustomerController::class, 'create'])->name('customers.create');
// Route::post('/create-customer', [CustomerController::class, 'store'])->name('customers.store');
// Route::get('/customer-{customer}/success', [CustomerController::class, 'success'])->name('customers.success');

// Route::resource('survey-requests', SurveyRequestController::class);

// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::get('dashboard', function () {
//         return Inertia::render('dashboard');
//     })->name('dashboard');


//     Route::resource('subscribers', SubscriberController::class);
//     Route::resource('resource-checks', ResourceCheckController::class);
// });

// Route::prefix('client')->group(function () {
//     Route::post('/send-otp', [ClientAuthController::class, 'sendOneTimePassword'])->name('sendOtp');
//     Route::post('/verify-otp', [ClientAuthController::class, 'verifyOneTimePassword'])->name('verifyOtp');
//     Route::post('/login', [ClientAuthController::class, 'login'])->name('client.session.login');
//     Route::post('/logout', [ClientAuthController::class, 'logout'])->name('client.session.logout');
// });


// Route::get('/sendotp', function () {
//     return Inertia::render('client/sendotp');
// })->name('sendotp');

// Route::get('/verifyotp', function () {
//     return Inertia::render('client/verifyotp');
// })->name('verifyotp');

// Route::get('/dashboard', function () {
//     return Inertia::render('client/dashboard');
// })->name('client.dashboard');

// require __DIR__ . '/settings.php';
// require __DIR__ . '/auth.php';


use App\Http\Controllers\OtpAuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SupportRequestController;
use Inertia\Inertia;

// Home page with login button
Route::get('/', fn() => Inertia::render('Home'))->name('home');

// Public pages
// Route::get('/', fn () => inertia('Welcome'))->name('home');

// OTP guest pages
Route::middleware('guest:otp')->group(function () {
    Route::get('/otp/phone', [OtpAuthController::class, 'showPhoneForm'])->name('otp.phone');
    Route::post('/otp/send', [OtpAuthController::class, 'sendOneTimePassword'])->name('otp.send');
    Route::get('/otp/verify', [OtpAuthController::class, 'showVerifyForm'])->name('otp.verify.form');
    Route::post('/otp/verify', [OtpAuthController::class, 'verifyOneTimePassword'])->name('otp.verify');
});

// OTP protected pages (clients)
Route::middleware(['otp.auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/support-request', [SupportRequestController::class, 'index'])->name('support.request');
    Route::post('/logout', [OtpAuthController::class, 'logout'])->name('logout');
});