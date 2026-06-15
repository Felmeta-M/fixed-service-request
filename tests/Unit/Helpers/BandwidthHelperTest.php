<?php

use App\Helpers\BandwidthHelper;

// Pure helper — no Laravel boot or DB needed.

describe('BandwidthHelper::format', function () {
    it('returns null for null or empty input', function ($input) {
        expect(BandwidthHelper::format($input))->toBeNull();
    })->with([
        'null' => [null],
        'empty string' => [''],
    ]);

    it('parses legacy Mbps string formats (case/suffix insensitive)', function ($input) {
        expect(BandwidthHelper::format($input))->toBe('10 Mbps');
    })->with([
        '10M' => ['10M'],
        '10m' => ['10m'],
        '10mb' => ['10mb'],
        '10MB' => ['10MB'],
        '10mbps' => ['10mbps'],
    ]);

    it('promotes legacy strings >= 1000 Mbps to whole Gbps', function () {
        expect(BandwidthHelper::format('2000mbps'))->toBe('2 Gbps');
    });

    it('promotes legacy strings to fractional Gbps with one decimal', function () {
        expect(BandwidthHelper::format('1500m'))->toBe('1.5 Gbps');
    });

    it('converts KB numeric values to whole Mbps', function () {
        // 10240 KB / 1024 = 10 Mbps
        expect(BandwidthHelper::format(10240))->toBe('10 Mbps');
    });

    it('formats sub-Mbps KB values to one decimal', function () {
        // 512 KB / 1024 = 0.5 Mbps
        expect(BandwidthHelper::format(512))->toBe('0.5 Mbps');
    });

    it('formats zero as 0 Mbps (numeric path, not treated as empty)', function () {
        expect(BandwidthHelper::format(0))->toBe('0 Mbps');
    });

    it('promotes KB values >= 1000 Mbps to whole Gbps', function () {
        // 1024000 KB / 1024 = 1000 Mbps => 1 Gbps
        expect(BandwidthHelper::format(1024000))->toBe('1 Gbps');
    });

    it('formats fractional Gbps from KB to one decimal (documents the 1.0 Gbps quirk)', function () {
        // 1048576 KB / 1024 = 1024 Mbps => 1.024 Gbps => "1.0 Gbps"
        // NB: the docstring claims "1 Gbps"; the code actually returns "1.0 Gbps".
        expect(BandwidthHelper::format(1048576))->toBe('1.0 Gbps');
    });

    it('returns the raw value when above the 100 Gbps sanity ceiling', function () {
        // 104857600 KB = 100 Gbps is the ceiling (inclusive); one above returns raw.
        expect(BandwidthHelper::format(104857601))->toBe('104857601');
    });

    it('formats exactly at the 100 Gbps ceiling rather than bailing out', function () {
        // 104857600 KB / 1024 = 102400 Mbps => 102.4 Gbps
        expect(BandwidthHelper::format(104857600))->toBe('102.4 Gbps');
    });

    it('returns unparseable input unchanged', function ($input) {
        expect(BandwidthHelper::format($input))->toBe($input);
    })->with([
        'plain text' => ['abc'],
        'already formatted' => ['10 Mbps'],
    ]);
});

describe('BandwidthHelper::toKb', function () {
    it('returns null for null or empty input', function ($input) {
        expect(BandwidthHelper::toKb($input))->toBeNull();
    })->with([
        'null' => [null],
        'empty string' => [''],
    ]);

    it('casts numeric strings and ints to the raw KB integer', function ($input, $expected) {
        expect(BandwidthHelper::toKb($input))->toBe($expected);
    })->with([
        'numeric string' => ['10240', 10240],
        'int' => [10240, 10240],
        'leading-numeric legacy string' => ['10M', 10],
    ]);
});
