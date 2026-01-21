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
            // Broadband devices (for internet/data services)
            [
                'name' => 'Huawei ONT Router',
                'vendor' => 'Huawei',
                'model' => 'HG8245H',
                'device_type' => 'broadband',
                'price' => 1500.00,
                'description' => 'High-performance Optical Network Terminal (ONT) router with WiFi support. Perfect for home and small office use.',
                'is_active' => true,
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
                'device_type' => 'broadband',
                'price' => 1200.00,
                'description' => 'Reliable ONT modem with excellent signal strength and easy setup. Compatible with all major ISPs.',
                'is_active' => true,
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
                'device_type' => 'broadband',
                'price' => 2000.00,
                'description' => 'Advanced smart router with dual-band WiFi, parental controls, and mobile app management. Ideal for modern homes.',
                'is_active' => true,
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
                'device_type' => 'broadband',
                'price' => 1800.00,
                'description' => 'Premium fiber gateway with advanced features and excellent coverage. Best for large homes and offices.',
                'is_active' => true,
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
                'device_type' => 'broadband',
                'price' => 1000.00,
                'description' => 'Affordable and reliable basic ONT device. Perfect for budget-conscious customers.',
                'is_active' => true,
                'stock_quantity' => 40,
                'specifications' => [
                    'wifi' => 'No WiFi',
                    'ports' => '4 LAN',
                    'speed' => 'Up to 100Mbps',
                ],
            ],
            // Voice devices (for telephone services)
            [
                'name' => 'Huawei Voice Terminal',
                'vendor' => 'Huawei',
                'model' => 'HG8240V',
                'device_type' => 'voice',
                'price' => 800.00,
                'description' => 'Dedicated voice terminal device for telephone services. Reliable and easy to configure.',
                'is_active' => true,
                'stock_quantity' => 30,
                'specifications' => [
                    'ports' => '2 POTS',
                    'features' => 'Call waiting, Caller ID',
                ],
            ],
            [
                'name' => 'ZTE Voice Gateway',
                'vendor' => 'ZTE',
                'model' => 'F660V',
                'device_type' => 'voice',
                'price' => 750.00,
                'description' => 'Compact voice gateway device perfect for residential telephone services.',
                'is_active' => true,
                'stock_quantity' => 35,
                'specifications' => [
                    'ports' => '2 POTS',
                    'features' => 'Call forwarding, Voicemail',
                ],
            ],
            [
                'name' => 'Huawei Enterprise Voice Router',
                'vendor' => 'Huawei',
                'model' => 'HG8245V',
                'device_type' => 'voice',
                'price' => 1200.00,
                'description' => 'Enterprise-grade voice router with multiple POTS ports for business use.',
                'is_active' => true,
                'stock_quantity' => 20,
                'specifications' => [
                    'ports' => '4 POTS',
                    'features' => 'PBX support, Conference calling',
                ],
            ],
            // Universal devices (can be used for both broadband and voice)
            [
                'name' => 'ZTE Enterprise Router',
                'vendor' => 'ZTE',
                'model' => 'F680',
                'device_type' => 'universal',
                'price' => 2500.00,
                'description' => 'Enterprise-grade router with advanced security features, VPN support, and high-speed connectivity. Supports both data and voice.',
                'is_active' => true,
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
