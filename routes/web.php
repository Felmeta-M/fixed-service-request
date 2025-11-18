<?php

use App\Http\Controllers\Api\v1\EsignetController;
use App\Http\Controllers\Api\v1\NidController;
use App\Http\Controllers\OtpAuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SupportRequestController;
use Inertia\Inertia;

Route::get('/', fn() => Inertia::render('Login'))->name('login');
Route::get('/home', fn() => Inertia::render('Home'))->name('home');
Route::get('/verification', fn() => Inertia::render('Verification'))->name('verification');

Route::get('/login/esignet', [EsignetController::class, 'redirectToEsignet'])
    ->name('esignet.login');

Route::get('/callback', [EsignetController::class, 'handleEsignetCallback'])
    ->name('esignet.callback');

// NID routes in web.php with session support
Route::prefix('api/v1')->middleware('web')->group(function () {
    Route::post('/nid/otp', [NidController::class, 'getOtp']);
    Route::post('/nid/kyc', [NidController::class, 'getKyc']);
});

// OTP guest pages
Route::middleware('guest:otp')->group(function () {
    Route::get('/otp/phone', [OtpAuthController::class, 'showPhoneForm'])->name('otp.phone');
    Route::post('/otp/send', [OtpAuthController::class, 'sendOneTimePassword'])->name('otp.send');
    Route::get('/otp/verify', [OtpAuthController::class, 'showVerifyForm'])->name('otp.verify.form');
    Route::post('/otp/verify', [OtpAuthController::class, 'verifyOneTimePassword'])->name('otp.verify');
    Route::get('/create-customer', fn() => Inertia::render('Customers/Create'))->name('customers.create');
});

// OTP protected pages
Route::middleware(['otp.auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    // Route::get('/survey-requests', fn() => Inertia::render('SurveyRequests/Index'))->name('survey.requests.dashboard');
    Route::get('/support-request', [SupportRequestController::class, 'index'])->name('support.request');
    Route::post('/logout', [OtpAuthController::class, 'logout'])->name('logout');
    Route::get('/create-customer', fn() => Inertia::render('Customers/Create'))->name('customers.create');

    Route::get('/create-survey-requests', fn() => Inertia::render('SurveyRequests/Create'))->name('survey.create');
    // Route::get('/survey-requests/create-subscriber/{id}', function ($id) {
    //     return Inertia::render('Subscriber/Create', [
    //         'surveyOrderId' => $id,
    //         'customerCode' => request('customer_code'),
    //         'offeringId' => request('offering_id'),
    //     ]);
    // })->name('subscriber.create');

    Route::get('/survey-requests/create-subscriber/{id}', function ($id) {
        return Inertia::render('Subscriber/Create', [
            'surveyOrderId' => $id,
            'customerCode' => request('customer_code'),
            'offeringId' => request('offering_id'),
            // 'subscriber_data' => request('subscriber_data'),
            'available_numbers' => request('available_numbers'),
            // 'survey_data' => request('survey_data'),
        ]);
    })->name('subscriber.create');

    // Add this route for NID success redirect
    Route::get('/nid/success', [App\Http\Controllers\OtpAuthController::class, 'handleNidSuccess'])
        ->name('nid.success')
        ->middleware('web');

    Route::get('/profile', function () {
        return Inertia::render('Profile/Index');
    })->name('profile');

    // Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
});
