<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class GuestRoleSeeder extends Seeder
{
    /**
     * Seed the default 'guest' role.
     */
    public function run(): void
    {
        Role::firstOrCreate(
            ['name' => 'guest', 'guard_name' => 'web']
        );
    }
}
