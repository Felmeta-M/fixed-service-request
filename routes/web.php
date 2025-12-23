<?php

use App\Http\Controllers\Api\v1\EsignetController;
use App\Http\Controllers\Api\v1\NidController;
use App\Http\Controllers\Api\v1\PaymentController;
use App\Http\Controllers\Api\v1\TelebirrController;
use App\Http\Controllers\OtpAuthController;
use App\Http\Controllers\SupportRequestController;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\SurveyRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;


Route::get('/', fn() => Inertia::render('Home'))->name('home');
Route::get('/verification', fn() => Inertia::render('Verification'))->name('verification');

Route::get('/login/esignet', [EsignetController::class, 'redirectToEsignet'])
    ->name('esignet.login');

Route::get('/callback', [EsignetController::class, 'handleEsignetCallback'])->name('esignet.callback');

Route::get('/auth/error', function () {
    return Inertia::render('Auth/Error', [
        'error' => session('error'),
    ]);
})->name('auth.error');


//Route::get('/customers', [CustomerController::class, 'create'])->name('customer.create');

// NID routes in web.php with session support
Route::prefix('api/v1')->middleware('web')->group(function () {
    Route::post('/nid/otp', [NidController::class, 'getOtp']);
    Route::post('/nid/kyc', [NidController::class, 'getKyc']);
});

// OTP guest pages
Route::middleware('guest:otp')->group(function () {
    Route::get('/login', [OtpAuthController::class, 'showPhoneForm'])->name('otp.phone');
    Route::post('/otp/send', [OtpAuthController::class, 'sendOneTimePassword'])->name('otp.send');
    Route::get('/otp/verify', [OtpAuthController::class, 'showVerifyForm'])->name('otp.verify.form');
    Route::post('/otp/verify', [OtpAuthController::class, 'verifyOneTimePassword'])->name('otp.verify');
});

// OTP protected pages
Route::middleware(['otp.auth'])->group(function () {
    Route::get('/services', action: fn() => Inertia::render('Services/Index'))->name('services');
    Route::get('/services/subscription-success', fn() => Inertia::render('Services/SubscriptionSuccess'))->name('services.subscription-success');
    // Route::get('/services/create', action: fn() => Inertia::render('Services/Create'))->name('services.create');
    // In your web.php
    Route::get('/services/create', function () {
        return Inertia::render('Services/Create', [
            'googleMapsApiKey' => config('services.google.google_api_key'),
        ]);
    })->name('services.create');

    Route::get('/services/{customerSurveyOrderId}', function (string $customerSurveyOrderId) {
        return Inertia::render('Services/Show', [
            'customerSurveyOrderId' => $customerSurveyOrderId,
        ]);
    })->name('services.show');

    Route::get('/payment/summary', function (Request $request) {
        $payment_details = new PaymentResource(Payment::query()->where('customer_survey_order_id', $request->query('customerSurveyOrderId'))->latest()->first());
        $survey_details = SurveyRequest::query()->where('customer_survey_order_id', $request->query('customerSurveyOrderId'))->latest()
            ->first(['customer_type', 'survey_type', 'main_offer_id', 'bandwidth']);
        return Inertia::render('Subscriber/PaymentSummary', [
            'payment_details' => $payment_details,
            'survey_details' => $survey_details,
            // 'subscriber_data' => json_decode($request->query('subscriber_data')),

            // 'fee_data' => json_decode($request->query('fee_data')),
            // 'customer_data' => json_decode($request->query('customer_data')),
            // 'survey_data' => json_decode($request->query('survey_data')),
            // 'is_fallback' => filter_var($request->query('is_fallback', false), FILTER_VALIDATE_BOOLEAN),
        ]);
    })->name('payment.summary');
    // Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    // Route::get('/survey-requests', fn() => Inertia::render('SurveyRequests/Index'))->name('survey.requests.dashboard');
    Route::get('/support-request', [SupportRequestController::class, 'index'])->name('support.request');
    Route::post('/logout', [OtpAuthController::class, 'logout'])->name('logout');
    Route::get('/create-customer', fn() => Inertia::render('Customers/Create'))->name('customers.create');

    Route::get('/complaints', fn() => Inertia::render('Complaints/Index'))->name('complaints.index');
    Route::get('/complaints/create', fn() => Inertia::render('Complaints/Create'))->name('complaints.create');


    Route::get('/create-survey-requests', fn() => Inertia::render('SurveyRequests/Create'))->name('survey.create');

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

    Route::get('/latest-resource', function () {
        $latestResource = session('latest_resource', null);

        if (!$latestResource) {
            return response()->json(['message' => 'No resource available'], 404);
        }

        return response()->json($latestResource);
    });
});

Route::post('/telebirr/notify', [TelebirrController::class, 'notify'])->name('telebirr.notify');

Route::get('/payment/success', function () {
    return Inertia::render('PaymentSuccess', [
        'amount' => '49.99',
        'currency' => 'USD',
        'reference' => 'PAY-123456',
    ]);
})->name('payment.success');


// Route::get('/health', function () {
//     return response()->json([
//         'status' => 'healthy',
//         'timestamp' => now(),
//         'services' => [
//             'database' => DB::connection()->getPdo() ? 'connected' : 'disconnected',
//             'redis' => app('redis')->connection()->ping() ? 'connected' : 'disconnected',
//             'queue' => 'unknown' // You can add queue health checks
//         ]
//     ]);
// });
