<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Setup required log directories for the professional logging system.
 *
 * Run once after deployment or when setting up a new environment:
 *   php artisan logs:setup
 */
class SetupLogDirectories extends Command
{
    protected $signature = 'logs:setup';

    protected $description = 'Create required log directories for the professional logging system';

    protected array $directories = [
        'logs/api',
        'logs/auth',
        'logs/payment',
        'logs/security',
        'logs/http',
        'logs/business',
        'logs/jobs',
        'logs/performance',
        'logs/audit',
        'logs/json',
        'logs/archives',
    ];

    public function handle(): int
    {
        $this->info('🔧 Setting up log directories...');
        $this->line('');

        $basePath = storage_path();
        $created = 0;

        foreach ($this->directories as $dir) {
            $fullPath = $basePath . '/' . $dir;

            if (!File::isDirectory($fullPath)) {
                File::makeDirectory($fullPath, 0755, true);
                $this->line("  ✅ Created: {$dir}");
                $created++;
            } else {
                $this->line("  ⏭️  Exists: {$dir}");
            }
        }

        // Create .gitignore in logs directory
        $gitignore = storage_path('logs/.gitignore');
        if (!File::exists($gitignore)) {
            File::put($gitignore, "*\n!.gitignore\n");
            $this->line('  ✅ Created: logs/.gitignore');
        }

        $this->line('');
        $this->info("✅ Done! Created {$created} new directories.");

        return Command::SUCCESS;
    }
}
