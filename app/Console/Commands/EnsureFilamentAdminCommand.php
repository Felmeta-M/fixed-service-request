<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class EnsureFilamentAdminCommand extends Command
{
    protected $signature = 'app:ensure-filament-admin
                            {--phone= : Phone number (e.g. 930011756 or 0930011756)}
                            {--password= : Password for the admin user}
                            {--email= : Email (used only when creating a new user)}
                            {--update-existing : If no user has this phone, update the first user (e.g. email-based admin) instead of creating a new one}';

    protected $description = 'Create or update a Filament admin user so they can log in with phone + password.';

    public function handle(): int
    {
        $phoneRaw = $this->option('phone') ?? $this->ask('Phone number (e.g. 930011756)');
        $password = $this->option('password') ?? $this->secret('Password');

        if (blank($phoneRaw) || blank($password)) {
            $this->error('Phone and password are required.');

            return self::FAILURE;
        }

        $phone = User::normalizePhone($phoneRaw);
        if (blank($phone)) {
            $this->error('Could not normalize phone number. Use at least 9 digits.');

            return self::FAILURE;
        }

        $user = User::query()->where('phone', $phone)->first();

        if ($user) {
            $user->password = $password;
            $user->save();
            $this->info("Updated existing user (id: {$user->id}) with phone {$phone} and new password.");

            return self::SUCCESS;
        }

        if ($this->option('update-existing')) {
            $user = User::query()->orderBy('id')->first();
            if ($user) {
                $user->phone = $phone;
                $user->password = $password;
                $user->save();
                $this->info("Updated existing user (id: {$user->id}) with phone {$phone}. You can now log in with this phone and password.");

                return self::SUCCESS;
            }
        }

        $email = $this->option('email') ?? ('admin-' . $phone . '@filament.local');
        $user = User::query()->create([
            'name' => 'Admin',
            'email' => $email,
            'phone' => $phone,
            'password' => $password,
        ]);

        $this->info("Created Filament admin with phone {$phone}. You can log in at your panel login page.");

        return self::SUCCESS;
    }
}
