<?php

use App\Services\TurnstileService;
use Illuminate\Support\Facades\Http;

uses(Tests\TestCase::class);

it('verifies turnstile success', function () {
    // Arrange: configure turnstile keys in config
    config(['services.turnstile.secret_key' => 'test-turnstile-secret', 'services.turnstile.site_key' => 'test-site']);

    // Mock the HTTP response from Cloudflare
    Http::fake([
        'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response([
            'success' => true,
        ], 200),
    ]);

    $svc = new TurnstileService();

    $result = $svc->verify('dummy-token', '127.0.0.1');

    expect($result['success'])->toBeTrue();
    expect($result['message'])->toBe('Verification successful');
});

it('handles turnstile failure', function () {
    config(['services.turnstile.secret_key' => 'test-turnstile-secret', 'services.turnstile.site_key' => 'test-site']);

    Http::fake([
        'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response([
            'success' => false,
            'error-codes' => ['invalid-input-response'],
        ], 200),
    ]);

    $svc = new TurnstileService();

    $result = $svc->verify('invalid-token', null);

    expect($result['success'])->toBeFalse();
    expect(strtolower($result['message']))->toContain('security');
});
