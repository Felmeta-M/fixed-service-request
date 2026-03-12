<?php

use App\Http\Controllers\Api\v1\EsignetController;
use App\Http\Controllers\Api\v1\NidController;
use App\Http\Controllers\Api\v1\TelebirrController;
use App\Http\Controllers\OtpAuthController;
use App\Http\Controllers\SupportRequestController;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\SurveyOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

// Locale switching route
Route::post('/locale', function (Request $request) {
    $locale = $request->input('locale');
    $supportedLocales = ['en', 'am', 'om', 'so', 'ti', 'aa'];

    Log::info('Locale switch requested', ['locale' => $locale, 'supported' => in_array($locale, $supportedLocales)]);

    if (in_array($locale, $supportedLocales)) {
        Session::put('locale', $locale);
        App::setLocale($locale);
        Log::info('Locale set successfully', ['new_locale' => $locale, 'session_id' => Session::getId()]);
    }

    // Return JSON response - the frontend will reload the page
    return response()->json(['success' => true, 'locale' => $locale]);
})->name('locale.switch');

Route::get('/', fn() => Inertia::render('home', [
    'googleMapsApiKey' => config('services.google.maps_frontend_key', ''),
]))->name('home');
Route::get('/complaint', fn() => Inertia::render('complaint'))->name('complaint');
Route::get('/terms', fn() => Inertia::render('terms'))->name('terms');
Route::get('/verification', fn() => Inertia::render('Verification'))->name('verification');

Route::get('/login/esignet', [EsignetController::class, 'redirectToEsignet'])
    ->name('esignet.login');

Route::get('/staging/callback', [EsignetController::class, 'handleEsignetCallback'])->name('esignet.staging.callback');

Route::get('/callback', [EsignetController::class, 'handleEsignetCallback'])->name('esignet.callback');

Route::get('/auth/error', function () {
    return Inertia::render('auth/error', [
        'error' => session('error'),
    ]);
})->name('auth.error');


// NID routes in web.php with session support
Route::prefix('api/v1')->middleware('web')->group(function () {
    Route::post('/nid/otp', [NidController::class, 'getOtp']);
    Route::post('/nid/kyc', [NidController::class, 'getKyc']);
});

// Guest auth: login page (OTP phone form) at /login; eSignet at /login/esignet
Route::middleware('guest:otp')->group(function () {
    Route::get('/login', [OtpAuthController::class, 'showPhoneForm'])->name('login');
    Route::redirect('/otp/phone', '/login', 301);
    Route::post('/otp/send', [OtpAuthController::class, 'sendOneTimePassword'])->name('otp.send');
    Route::get('/otp/verify', [OtpAuthController::class, 'showVerifyForm'])->name('otp.verify.form');
    Route::post('/otp/verify', [OtpAuthController::class, 'verifyOneTimePassword'])->name('otp.verify');
});

// OTP protected pages
Route::middleware(['otp.auth'])->group(function () {
    Route::get('/services', fn() => Inertia::render('services/index'))->name('services');
    Route::get('/services/subscription-success', fn() => Inertia::render('services/subscription-success'))->name('services.subscription-success');

    Route::get('/services/create', function () {
        return Inertia::render('services/create', [
            'googleMapsApiKey' => config('services.google.maps_frontend_key', ''),
        ]);
    })->name('services.create');

    Route::get('/services/resume/{customerSurveyOrderId}', function (string $customerSurveyOrderId) {
        return Inertia::render('services/resume', [
            'googleMapsApiKey' => config('services.google.maps_frontend_key', ''),
            'customerSurveyOrderId' => $customerSurveyOrderId,
        ]);
    })->name('services.resume');

    Route::get('/services/manual-create', function (Request $request) {
        $formData = null;
        if ($request->has('formData')) {
            $formDataJson = $request->query('formData');
            if ($formDataJson) {
                $formData = json_decode($formDataJson, true);
            }
        }
        return Inertia::render('services/manual-create', [
            'googleMapsApiKey' => config('services.google.maps_frontend_key', ''),
            'formData' => $formData,
        ]);
    })->name('services.manual-create');

    Route::get('/services/{customerSurveyOrderId}', function (string $customerSurveyOrderId) {
        return Inertia::render('services/show', [
            'customerSurveyOrderId' => $customerSurveyOrderId,
        ]);
    })->name('services.show');

    Route::get('/payment/summary', function (Request $request) {
        $payment_details = new PaymentResource(Payment::query()->where('customer_survey_order_id', $request->query('customerSurveyOrderId'))->latest()->first());
        $survey_details = SurveyOrder::query()->where('customer_survey_order_id', $request->query('customerSurveyOrderId'))->latest()
            ->first(['customer_type', 'survey_type', 'main_offer_id', 'bandwidth']);
        return Inertia::render('subscriber/payment-summary', [
            'payment_details' => $payment_details,
            'survey_details' => $survey_details,
        ]);
    })->name('payment.summary');

    Route::get('/support-request', [SupportRequestController::class, 'index'])->name('support.request');
    Route::post('/logout', [OtpAuthController::class, 'logout'])->name('logout');
    Route::get('/create-customer', fn() => Inertia::render('customers/create'))->name('customers.create');

    Route::get('/complaints', fn() => Inertia::render('complaints/index'))->name('complaints.index');
    Route::get('/complaints/create', fn() => Inertia::render('complaints/create'))->name('complaints.create');
    Route::get('/complaints/{ttNumber}', function (string $ttNumber) {
        return Inertia::render('complaints/show', [
            'ttNumber' => $ttNumber,
        ]);
    })->name('complaints.show');


    Route::get('/create-survey-requests', fn() => Inertia::render('survey-requests/create'))->name('survey.create');

    Route::get('/survey-requests/create-subscriber/{id}', function ($id) {
        return Inertia::render('subscriber/create', [
            'surveyOrderId' => $id,
            'customerCode' => request('customer_code'),
            'offeringId' => request('offering_id'),
            'available_numbers' => request('available_numbers'),
        ]);
    })->name('subscriber.create');

    // Add this route for NID success redirect
    Route::get('/nid/success', [OtpAuthController::class, 'handleNidSuccess'])
        ->name('nid.success')
        ->middleware('web');

    Route::get('/profile', function () {
        return Inertia::render('profile/index');
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
    return Inertia::render('payment-success', [
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
