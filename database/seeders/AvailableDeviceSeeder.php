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
            [
                'name' => 'Huawei ONT Router',
                'vendor' => 'Huawei',
                'model' => 'HG8245H',
                'price' => 1500.00,
                'description' => 'High-performance Optical Network Terminal (ONT) router with WiFi support. Perfect for home and small office use.',
                'status' => 'active',
                'stock_quantity' => 50,
                'specifications' => [
                    'wifi' => '802.11n',
                    'ports' => '4 LAN + 2 POTS',
                    'speed' => 'Up to 1Gbps',
                ],
            ],
            [
                'name' => 'ZTE ONT Modem',
                'vendor' => 'ZTE',
                'model' => 'F660',
                'price' => 1200.00,
                'description' => 'Reliable ONT modem with excellent signal strength and easy setup. Compatible with all major ISPs.',
                'status' => 'active',
                'stock_quantity' => 35,
                'specifications' => [
                    'wifi' => '802.11n',
                    'ports' => '4 LAN + 2 POTS',
                    'speed' => 'Up to 1Gbps',
                ],
            ],
            [
                'name' => 'Huawei Smart Router',
                'vendor' => 'Huawei',
                'model' => 'HG8245W5',
                'price' => 2000.00,
                'description' => 'Advanced smart router with dual-band WiFi, parental controls, and mobile app management. Ideal for modern homes.',
                'status' => 'active',
                'stock_quantity' => 25,
                'specifications' => [
                    'wifi' => '802.11ac Dual-band',
                    'ports' => '4 LAN + 2 POTS',
                    'speed' => 'Up to 1.2Gbps',
                ],
            ],
            [
                'name' => 'ZTE Fiber Gateway',
                'vendor' => 'ZTE',
                'model' => 'F670L',
                'price' => 1800.00,
                'description' => 'Premium fiber gateway with advanced features and excellent coverage. Best for large homes and offices.',
                'status' => 'active',
                'stock_quantity' => 30,
                'specifications' => [
                    'wifi' => '802.11ac',
                    'ports' => '4 LAN + 2 POTS',
                    'speed' => 'Up to 1Gbps',
                ],
            ],
            [
                'name' => 'Huawei Basic ONT',
                'vendor' => 'Huawei',
                'model' => 'HG8240',
                'price' => 1000.00,
                'description' => 'Affordable and reliable basic ONT device. Perfect for budget-conscious customers.',
                'status' => 'active',
                'stock_quantity' => 40,
                'specifications' => [
                    'wifi' => 'No WiFi',
                    'ports' => '4 LAN',
                    'speed' => 'Up to 100Mbps',
                ],
            ],
            [
                'name' => 'ZTE Enterprise Router',
                'vendor' => 'ZTE',
                'model' => 'F680',
                'price' => 2500.00,
                'description' => 'Enterprise-grade router with advanced security features, VPN support, and high-speed connectivity.',
                'status' => 'active',
                'stock_quantity' => 15,
                'specifications' => [
                    'wifi' => '802.11ac',
                    'ports' => '8 LAN + 4 POTS',
                    'speed' => 'Up to 2.5Gbps',
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
