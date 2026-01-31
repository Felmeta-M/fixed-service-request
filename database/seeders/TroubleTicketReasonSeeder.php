<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TroubleTicketReasonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        $reasons = [
            // GSM (network_type: 21)
            [
                'network_type' => 21,
                'network_name' => 'GSM',
                'reason_path' => 'GSM Voice',
                'reason' => 'Unable to make/receive call',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'network_type' => 21,
                'network_name' => 'GSM',
                'reason_path' => 'GSM-GPRS',
                'reason' => 'Unable to use internet/Speed Issue',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'network_type' => 21,
                'network_name' => 'GSM',
                'reason_path' => 'Billing',
                'reason' => 'Bill Problem/Balance Lost',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'network_type' => 21,
                'network_name' => 'GSM',
                'reason_path' => 'GSM VAS',
                'reason' => 'Unable to send/receive SMS',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'network_type' => 21,
                'network_name' => 'GSM',
                'reason_path' => 'Voucher/IN/OCS',
                'reason' => 'Unable to recharge balance',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'network_type' => 21,
                'network_name' => 'GSM',
                'reason_path' => 'Fraud Complaint',
                'reason' => 'Fraud Complain',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'network_type' => 21,
                'network_name' => 'GSM',
                'reason_path' => 'Customer Complaint',
                'reason' => 'Other',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // FBB (network_type: 3)
            [
                'network_type' => 3,
                'network_name' => 'FBB',
                'reason_path' => 'Direct Fiber',
                'reason' => 'Service is Down',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'network_type' => 3,
                'network_name' => 'FBB',
                'reason_path' => 'Speed-Problem',
                'reason' => 'Speed Problem',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'network_type' => 3,
                'network_name' => 'FBB',
                'reason_path' => 'Billing',
                'reason' => 'Bill Problem',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'network_type' => 3,
                'network_name' => 'FBB',
                'reason_path' => 'BB-ADSL',
                'reason' => 'Other',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Fixed Line (network_type: 4)
            [
                'network_type' => 4,
                'network_name' => 'Fixed Line',
                'reason_path' => 'Radio Network',
                'reason' => 'Service is Down',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'network_type' => 4,
                'network_name' => 'Fixed Line',
                'reason_path' => 'Billing',
                'reason' => 'Bill Problem',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'network_type' => 4,
                'network_name' => 'Fixed Line',
                'reason_path' => 'Fixed Line',
                'reason' => 'Unable to make/receive call',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'network_type' => 4,
                'network_name' => 'Fixed Line',
                'reason_path' => 'MSAG',
                'reason' => 'Other',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('trouble_ticket_reasons')->upsert(
            $reasons,
            ['network_type', 'reason_path', 'reason'],
            ['network_name', 'status', 'updated_at']
        );
    }
}
