<?php

use App\Http\Controllers\Api\v1\EsignetController;
use App\Http\Controllers\Api\v1\NidController;
use App\Http\Controllers\Api\v1\TelebirrController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OtpAuthController;
use App\Http\Controllers\SupportRequestController;
use Inertia\Inertia;
use Illuminate\Http\Request;

Route::get('/services', action: fn() => Inertia::render('Services/Index'))->name('services');
Route::get('//services/create', action: fn() => Inertia::render('/services/create'))->name('services.new');
// Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

Route::get('/map', action: fn() => Inertia::render(
    'ServiceRequest/Create',
    [
        'googleMapsApiKey' => config('services.google.google_api_key'),
    ]
))->name('servicess');


Route::get('/login', fn() => Inertia::render('Login'))->name('login');

// Route::get('/', fn() => Inertia::render('Login'))->name('login');
Route::get('/', fn() => Inertia::render('Home'))->name('home');
Route::get('/verification', fn() => Inertia::render('Verification'))->name('verification');

Route::get('/login/esignet', [EsignetController::class, 'redirectToEsignet'])
    ->name('esignet.login');

Route::get('/callback', [EsignetController::class, 'handleEsignetCallback'])
    ->name('esignet.callback');

Route::get('/auth/error', function () {
    return Inertia::render('Auth/Error', [
        'error' => session('error'),
    ]);
})->name('auth.error');


Route::get('/customers', [CustomerController::class, 'create'])
    ->name('customer.create');

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
    // Main service page (landing page after login)
    // Route::get('/services', action: fn() => Inertia::render('Services/Index'))->name('services');
    // Route::get('/services/create', action: fn() => Inertia::render('Services/Create'))->name('services.create');

    // Route::get('/payment/summary', fn() => Inertia::render('Subscriber/PaymentSummary'))->name('payment.summary');
    // Route::get('/payment/summary', function (Request $request) {
    //     return Inertia::render('Subscriber/PaymentSummary', [
    //         'survey_id' => $request->query('survey_id'),
    //         'subscriber_data' => $request->query('subscriber_data'),
    //         'service_number' => $request->query('service_number'),
    //         'fee_data' => $request->query('fee_data'),
    //         'customer_data' => $request->query('customer_data'),
    //         'survey_data' => $request->query('survey_data'),
    //         'is_fallback' => $request->query('is_fallback', false),
    //     ]);
    // })->name('payment.summary');
    Route::get('/payment/summary', function (Request $request) {
        return Inertia::render('Subscriber/PaymentSummary', [
            'survey_id' => $request->query('survey_id'),
            'subscriber_data' => json_decode($request->query('subscriber_data')),
            'service_number' => $request->query('service_number'),
            'fee_data' => json_decode($request->query('fee_data')),
            'customer_data' => json_decode($request->query('customer_data')),
            'survey_data' => json_decode($request->query('survey_data')),
            'is_fallback' => filter_var($request->query('is_fallback', false), FILTER_VALIDATE_BOOLEAN),
        ]);
    })->name('payment.summary');
    // Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
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

Route::post('/telebirr/notify', [TelebirrController::class, 'notify'])->name('telebirr.notify');
