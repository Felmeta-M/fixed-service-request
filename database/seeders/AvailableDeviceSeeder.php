<?php

namespace Database\Seeders;

use App\Models\AvailableDevice;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AvailableDeviceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $devices = [
            // Internet/Broadband devices (for internet/data services) - FIBER (PON)
            [
                'name' => 'SINGLE-BAND ZXHN F660 V9.2 GPON MODEM',
                'vendor' => 'ZTE Corporation',
                'model' => 'ZXHN F660 V9.2',
                'device_type' => 'broadband',
                'media_type' => 'PON', // Fiber device (GPON)
                'price' => 5900.00,
                'description' => 'High-performance GPON modem with WiFi support. Features 2.4 GHz single-band WiFi 4 technology, 4 LAN ports, and 1 POTS port for voice. Ideal for residential customers with excellent coverage up to 20 KM operating range.',
                'is_active' => true,
                'image_url' => '/devices/zxhn-f660-v9.2-gpon-modem.png',
                'stock_quantity' => 50,
                'specifications' => [
                    'speed' => [
                        'lan_cable' => '1 GBPS (Upstream and Downstream)',
                        'wifi' => '50 MBPS',
                    ],
                    'ethernet' => [
                        'lan_ports' => '4 LAN PORT (RJ 45)',
                        'pots_port' => '1 POTS port for voice (RJ 11)',
                    ],
                    'operating_range' => 'Up to 20 KM',
                    'wifi_features' => [
                        'standard' => '802.11 b/g/n',
                        'type' => '2.4 GHz Single band Wi-Fi modem',
                        'technology' => 'Wi-Fi 4',
                    ],
                    'functionality' => 'Works well for all weather conditions from 0 to 50 °C. Designed for residential customers.',
                    'supplier' => 'ZTE Corporation',
                ],
            ],
            [
                'name' => 'SINGLE-BAND TG2212 GPON MODEM',
                'vendor' => 'Sichuan Tianyi Comheart Telecom Co., LTD',
                'model' => 'TG2212',
                'device_type' => 'broadband',
                'media_type' => 'PON', // Fiber device (GPON)
                'price' => 4996.00,
                'description' => 'Reliable GPON modem with WiFi 4 technology. Features 2.4 GHz single-band WiFi, 4 LAN ports, and 1 POTS port for voice. Excellent for residential use with good indoor and outdoor coverage.',
                'is_active' => true,
                'image_url' => '/devices/tg2212-gpon-modem.png',
                'stock_quantity' => 45,
                'specifications' => [
                    'speed' => [
                        'lan_cable' => '1 GBPS (Upstream and Downstream)',
                        'wifi' => '50 MBPS',
                    ],
                    'ethernet' => [
                        'lan_ports' => '4 LAN PORT (RJ 45)',
                        'pots_port' => '1 POTS port for voice (RJ 11)',
                    ],
                    'operating_range' => [
                        'indoor' => 'Up to 120 meters',
                        'outdoor' => 'Up to 360 meters (depending on the environment)',
                    ],
                    'wifi_features' => [
                        'standard' => '802.11 b/g/n',
                        'type' => '2.4 Ghz Single band wifi modem',
                        'technology' => 'Wifi 4 technology',
                    ],
                    'functionality' => 'Works well for all weather conditions from 0 to 45 °C. Designed for residential customers.',
                    'supplier' => 'Sichuan Tianyi Comheart Telecom.co,.LTD',
                ],
            ],
            // Voice devices (for telephone services) - UNIVERSAL (work with any media)
            // These will be shown for combo services
            [
                'name' => 'FIXED WIRE LINE APPARATUS- ORPAT 1010',
                'vendor' => 'Shive Enterprise',
                'model' => 'ORPAT 1010',
                'device_type' => 'voice',
                'media_type' => 'UNIVERSAL', // Works with both fiber and copper
                'price' => 1100.00,
                'description' => 'Reliable fixed line telephone apparatus for home or office use. Features clear and stable voice calls with support for local, national, and international calls. Works with network line power.',
                'is_active' => true,
                'image_url' => '/devices/orpat-1010-phone.png',
                'stock_quantity' => 60,
                'specifications' => [
                    'service_type' => 'Fixed line telephone service',
                    'usage' => 'For home or office use',
                    'connection' => 'Wired connection installed at a fixed location',
                    'voice_quality' => 'Clear and stable voice calls',
                    'calling_options' => 'Local, National and International calls',
                    'power' => 'Works with the network line',
                    'supplier' => 'Shive Enterprise',
                ],
            ],
            [
                'name' => 'FIXED WIRE LINE APPARATUS- C168',
                'vendor' => 'Tomi Holding Limited',
                'model' => 'C168',
                'device_type' => 'voice',
                'media_type' => 'UNIVERSAL', // Works with both fiber and copper
                'price' => 1300.00,
                'description' => 'Feature-rich fixed line telephone with screen display. Perfect for home or office use with clear voice quality. Supports local, national, and international calls. Includes display screen for caller information.',
                'is_active' => true,
                'image_url' => '/devices/c168-phone.png',
                'stock_quantity' => 55,
                'specifications' => [
                    'service_type' => 'Fixed line telephone service',
                    'display' => 'Screen display',
                    'usage' => 'For home or office use',
                    'connection' => 'Wired connection installed at a fixed location',
                    'voice_quality' => 'Clear and stable voice calls',
                    'calling_options' => 'Local, National and International calls',
                    'power' => 'Works with the network line',
                    'supplier' => 'Tomi Holding Limited',
                ],
            ],
            [
                'name' => 'FIXED WIRE LINE APPARATUS- ECG 400',
                'vendor' => 'BAB AL FETAH',
                'model' => 'ECG 400',
                'device_type' => 'voice',
                'media_type' => 'UNIVERSAL', // Works with both fiber and copper
                'price' => 1300.00,
                'description' => 'Modern fixed line telephone with screen display. Ideal for home or office use with excellent voice quality. Supports all calling options including local, national, and international calls.',
                'is_active' => true,
                'image_url' => '/devices/ecg-400-phone.png',
                'stock_quantity' => 50,
                'specifications' => [
                    'service_type' => 'Fixed line telephone service',
                    'display' => 'Screen display',
                    'usage' => 'For home or office use',
                    'connection' => 'Wired connection installed at a fixed location',
                    'voice_quality' => 'Clear and stable voice calls',
                    'calling_options' => 'Local, National and International calls',
                    'power' => 'Works with the network line',
                    'supplier' => 'BAB AL FETAH',
                ],
            ],
            [
                'name' => 'FIXED WIRE LINE APPARATUS- FL199',
                'vendor' => 'Shenzhen Gren Tech RF Communication Limited',
                'model' => 'FL199',
                'device_type' => 'voice',
                'media_type' => 'UNIVERSAL', // Works with both fiber and copper
                'price' => 1300.00,
                'description' => 'Professional fixed line telephone apparatus for home or office use. Features clear and stable voice calls with support for local, national, and international calling options. Reliable wired connection.',
                'is_active' => true,
                'image_url' => '/devices/fl199-phone.png',
                'stock_quantity' => 48,
                'specifications' => [
                    'service_type' => 'Fixed line telephone service',
                    'usage' => 'For home or office use',
                    'connection' => 'Wired connection installed at a fixed location',
                    'voice_quality' => 'Clear and stable voice calls',
                    'calling_options' => 'Local, National and International calls',
                    'power' => 'Works with the network line',
                    'supplier' => 'Shenzhen Gren Tech RF Communication Limited',
                ],
            ],
        ];

        foreach ($devices as $device) {
            AvailableDevice::create([
                'id' => Str::uuid(),
                ...$device,
            ]);
        }
    }
}
