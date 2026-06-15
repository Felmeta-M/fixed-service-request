<?php

use App\Services\Payment\CableChargeService;

// Pure calculator — no Laravel boot or DB needed.

beforeEach(function () {
    $this->service = new CableChargeService();
});

it('returns 0 when cable length is missing or zero', function ($length) {
    expect($this->service->calculate($length, 1))->toBe(0.0);
})->with([
    'null length' => [null],
    'zero length' => [0.0],
]);

it('returns 0 when cable type is missing', function () {
    expect($this->service->calculate(600, null))->toBe(0.0);
});

it('returns 0 for copper (type 0) — empty(0) guard makes it never chargeable', function () {
    // Documents a latent bug: copper has a unit price (13) but empty($cableType)
    // short-circuits on type 0, so copper cable length is never billed.
    expect($this->service->calculate(600, 0))->toBe(0.0);
});

it('returns 0 for an unknown cable type not in the price table', function () {
    expect($this->service->calculate(700, 5))->toBe(0.0);
});

it('returns 0 when length is within the free 500m allowance', function ($length) {
    expect($this->service->calculate($length, 1))->toBe(0.0);
})->with([
    'below allowance' => [400.0],
    'exactly at allowance' => [500.0],
]);

it('charges fiber (type 1) only for metres beyond the 500m allowance', function () {
    // (600 - 500) * 45 * 1.3225 = 5951.25
    expect($this->service->calculate(600, 1))->toEqualWithDelta(5951.25, 0.001);
});

it('charges just one metre over the allowance', function () {
    // (501 - 500) * 45 * 1.3225 = 59.5125 -> round(,2) = 59.51
    expect($this->service->calculate(501, 1))->toEqualWithDelta(59.51, 0.001);
});

it('charges EPON and GPON (types 2 and 3) at the same 45 birr unit price', function ($type) {
    // (700 - 500) * 45 * 1.3225 = 11902.5
    expect($this->service->calculate(700, $type))->toEqualWithDelta(11902.5, 0.001);
})->with([
    'EPON' => [2],
    'GPON' => [3],
]);

it('accepts the cable type as a numeric string', function () {
    expect($this->service->calculate(600, '1'))->toEqualWithDelta(5951.25, 0.001);
});

it('scales the charge with longer cable runs', function () {
    // (1000 - 500) * 45 * 1.3225 = 29756.25
    expect($this->service->calculate(1000, 1))->toEqualWithDelta(29756.25, 0.001);
});
