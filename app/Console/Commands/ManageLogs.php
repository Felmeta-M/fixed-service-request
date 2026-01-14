<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Carbon\Carbon;
use ZipArchive;

/**
 * Artisan command for professional log management.
 *
 * Features:
 * - Clean old log files based on retention policy
 * - Archive logs to compressed files
 * - View log statistics
 * - Tail logs in real-time
 * - Search logs for patterns
 *
 * Usage:
 *   php artisan logs:manage clean          # Clean old logs
 *   php artisan logs:manage stats          # View log statistics
 *   php artisan logs:manage archive        # Archive old logs
 *   php artisan logs:manage tail api       # Tail API logs
 *   php artisan logs:manage search "error" # Search for pattern
 */
class ManageLogs extends Command
{
    protected $signature = 'logs:manage
                            {action=stats : Action to perform (stats|clean|archive|tail|search)}
                            {--channel= : Specific log channel to target}
                            {--days=14 : Days to retain for clean action}
                            {--pattern= : Search pattern for search action}
                            {--lines=50 : Number of lines for tail action}
                            {--follow : Follow log output in real-time}
                            {--dry-run : Show what would be done without doing it}';

    protected $description = 'Professional log management: clean, archive, view stats, tail, and search logs';

    protected string $logsPath;

    protected array $channelPaths = [
        'api' => 'api',
        'auth' => 'auth',
        'payment' => 'payment',
        'security' => 'security',
        'http' => 'http',
        'business' => 'business',
        'jobs' => 'jobs',
        'performance' => 'performance',
    ];

    public function handle(): int
    {
        $this->logsPath = storage_path('logs');

        return match ($this->argument('action')) {
            'stats' => $this->showStats(),
            'clean' => $this->cleanLogs(),
            'archive' => $this->archiveLogs(),
            'tail' => $this->tailLogs(),
            'search' => $this->searchLogs(),
            default => $this->showHelp(),
        };
    }

    /**
     * Show log statistics
     */
    protected function showStats(): int
    {
        $this->info('📊 Log Statistics');
        $this->line('');

        $stats = [];
        $totalSize = 0;
        $totalFiles = 0;

        // Main logs directory
        $mainFiles = File::glob($this->logsPath . '/*.log');
        $mainSize = array_sum(array_map(fn($f) => File::size($f), $mainFiles));
        $stats['main'] = [
            'files' => count($mainFiles),
            'size' => $mainSize,
        ];
        $totalSize += $mainSize;
        $totalFiles += count($mainFiles);

        // Channel-specific directories
        foreach ($this->channelPaths as $channel => $path) {
            $channelPath = $this->logsPath . '/' . $path;
            if (File::isDirectory($channelPath)) {
                $files = File::glob($channelPath . '/*.log');
                $size = array_sum(array_map(fn($f) => File::size($f), $files));
                $stats[$channel] = [
                    'files' => count($files),
                    'size' => $size,
                    'oldest' => $this->getOldestFile($files),
                    'newest' => $this->getNewestFile($files),
                ];
                $totalSize += $size;
                $totalFiles += count($files);
            }
        }

        // Display table
        $tableData = [];
        foreach ($stats as $channel => $data) {
            $tableData[] = [
                $channel,
                $data['files'],
                $this->formatBytes($data['size']),
                $data['oldest'] ?? '-',
                $data['newest'] ?? '-',
            ];
        }

        $this->table(
            ['Channel', 'Files', 'Size', 'Oldest', 'Newest'],
            $tableData
        );

        $this->line('');
        $this->info("Total: {$totalFiles} files, " . $this->formatBytes($totalSize));

        // Disk space warning
        $diskFree = disk_free_space($this->logsPath);
        if ($totalSize > $diskFree * 0.1) {
            $this->warn('⚠️  Logs are using more than 10% of available disk space!');
        }

        return Command::SUCCESS;
    }

    /**
     * Clean old log files
     */
    protected function cleanLogs(): int
    {
        $days = (int) $this->option('days');
        $channel = $this->option('channel');
        $dryRun = $this->option('dry-run');
        $cutoffDate = Carbon::now()->subDays($days);

        $this->info("🧹 Cleaning logs older than {$days} days" . ($dryRun ? ' (DRY RUN)' : ''));
        $this->line('');

        $deleted = 0;
        $freedSpace = 0;

        $directories = $channel
            ? [$this->logsPath . '/' . ($this->channelPaths[$channel] ?? '')]
            : [$this->logsPath, ...array_map(fn($p) => $this->logsPath . '/' . $p, $this->channelPaths)];

        foreach ($directories as $dir) {
            if (!File::isDirectory($dir)) {
                continue;
            }

            $files = File::glob($dir . '/*.log');

            foreach ($files as $file) {
                $modified = Carbon::createFromTimestamp(File::lastModified($file));

                if ($modified->lt($cutoffDate)) {
                    $size = File::size($file);
                    $relativePath = Str::after($file, $this->logsPath . '/');

                    if ($dryRun) {
                        $this->line("  Would delete: {$relativePath} (" . $this->formatBytes($size) . ")");
                    } else {
                        File::delete($file);
                        $this->line("  Deleted: {$relativePath} (" . $this->formatBytes($size) . ")");
                    }

                    $deleted++;
                    $freedSpace += $size;
                }
            }
        }

        $this->line('');
        $action = $dryRun ? 'Would delete' : 'Deleted';
        $this->info("✅ {$action} {$deleted} files, freeing " . $this->formatBytes($freedSpace));

        return Command::SUCCESS;
    }

    /**
     * Archive old logs to compressed files
     */
    protected function archiveLogs(): int
    {
        $days = (int) $this->option('days');
        $dryRun = $this->option('dry-run');
        $cutoffDate = Carbon::now()->subDays($days);

        $this->info("📦 Archiving logs older than {$days} days" . ($dryRun ? ' (DRY RUN)' : ''));
        $this->line('');

        $archiveDir = $this->logsPath . '/archives';
        if (!$dryRun && !File::isDirectory($archiveDir)) {
            File::makeDirectory($archiveDir, 0755, true);
        }

        $archived = 0;
        $originalSize = 0;

        $directories = [$this->logsPath, ...array_map(fn($p) => $this->logsPath . '/' . $p, $this->channelPaths)];

        $filesToArchive = [];

        foreach ($directories as $dir) {
            if (!File::isDirectory($dir)) {
                continue;
            }

            $files = File::glob($dir . '/*.log');

            foreach ($files as $file) {
                $modified = Carbon::createFromTimestamp(File::lastModified($file));

                if ($modified->lt($cutoffDate)) {
                    $filesToArchive[] = $file;
                    $originalSize += File::size($file);
                }
            }
        }

        if (empty($filesToArchive)) {
            $this->info('No files to archive.');
            return Command::SUCCESS;
        }

        $archiveName = 'logs-archive-' . Carbon::now()->format('Y-m-d-His') . '.zip';
        $archivePath = $archiveDir . '/' . $archiveName;

        if ($dryRun) {
            $this->line("Would create archive: {$archiveName}");
            foreach ($filesToArchive as $file) {
                $this->line("  - " . Str::after($file, $this->logsPath . '/'));
            }
        } else {
            if (!class_exists('ZipArchive')) {
                $this->error('ZipArchive extension is required for archiving.');
                return Command::FAILURE;
            }

            $zip = new ZipArchive();
            if ($zip->open($archivePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                $this->error('Failed to create archive.');
                return Command::FAILURE;
            }

            foreach ($filesToArchive as $file) {
                $relativePath = Str::after($file, $this->logsPath . '/');
                $zip->addFile($file, $relativePath);
                $this->line("  Added: {$relativePath}");
                $archived++;
            }

            $zip->close();

            // Delete archived files
            foreach ($filesToArchive as $file) {
                File::delete($file);
            }

            $archiveSize = File::size($archivePath);
            $compressionRatio = round((1 - $archiveSize / $originalSize) * 100, 1);

            $this->line('');
            $this->info("✅ Archived {$archived} files to {$archiveName}");
            $this->info("   Original: " . $this->formatBytes($originalSize) . " → Compressed: " . $this->formatBytes($archiveSize) . " ({$compressionRatio}% reduction)");
        }

        return Command::SUCCESS;
    }

    /**
     * Tail log files
     */
    protected function tailLogs(): int
    {
        $channel = $this->option('channel') ?? 'daily';
        $lines = (int) $this->option('lines');
        $follow = $this->option('follow');

        // Determine log file path
        $logFile = match ($channel) {
            'daily', 'main' => $this->logsPath . '/laravel-' . Carbon::now()->format('Y-m-d') . '.log',
            default => $this->getLatestLogFile($channel),
        };

        if (!$logFile || !File::exists($logFile)) {
            $this->error("Log file not found for channel: {$channel}");
            return Command::FAILURE;
        }

        $this->info("📄 Tailing: " . Str::after($logFile, $this->logsPath . '/'));
        $this->line(str_repeat('-', 60));

        if ($follow) {
            $this->followLog($logFile);
        } else {
            $this->displayLastLines($logFile, $lines);
        }

        return Command::SUCCESS;
    }

    /**
     * Search logs for pattern
     */
    protected function searchLogs(): int
    {
        $pattern = $this->option('pattern');
        $channel = $this->option('channel');

        if (!$pattern) {
            $this->error('Please provide a search pattern with --pattern="your pattern"');
            return Command::FAILURE;
        }

        $this->info("🔍 Searching for: {$pattern}");
        $this->line('');

        $directories = $channel
            ? [$this->logsPath . '/' . ($this->channelPaths[$channel] ?? '')]
            : [$this->logsPath, ...array_map(fn($p) => $this->logsPath . '/' . $p, $this->channelPaths)];

        $totalMatches = 0;

        foreach ($directories as $dir) {
            if (!File::isDirectory($dir)) {
                continue;
            }

            $files = File::glob($dir . '/*.log');

            foreach ($files as $file) {
                $matches = $this->searchInFile($file, $pattern);

                if (!empty($matches)) {
                    $relativePath = Str::after($file, $this->logsPath . '/');
                    $this->warn("📁 {$relativePath} (" . count($matches) . " matches):");

                    foreach (array_slice($matches, 0, 10) as $match) {
                        $this->line("   Line {$match['line']}: " . Str::limit($match['content'], 150));
                    }

                    if (count($matches) > 10) {
                        $this->line("   ... and " . (count($matches) - 10) . " more matches");
                    }

                    $this->line('');
                    $totalMatches += count($matches);
                }
            }
        }

        $this->info("✅ Found {$totalMatches} total matches");

        return Command::SUCCESS;
    }

    /**
     * Helper methods
     */

    protected function showHelp(): int
    {
        $this->info('Available actions:');
        $this->line('  stats   - Show log statistics');
        $this->line('  clean   - Clean old log files');
        $this->line('  archive - Archive old logs to zip');
        $this->line('  tail    - View recent log entries');
        $this->line('  search  - Search logs for pattern');
        $this->line('');
        $this->line('Examples:');
        $this->line('  php artisan logs:manage stats');
        $this->line('  php artisan logs:manage clean --days=7');
        $this->line('  php artisan logs:manage archive --days=30');
        $this->line('  php artisan logs:manage tail --channel=api --lines=100');
        $this->line('  php artisan logs:manage search --pattern="error" --channel=payment');

        return Command::SUCCESS;
    }

    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }

    protected function getOldestFile(array $files): ?string
    {
        if (empty($files)) {
            return null;
        }

        $oldest = null;
        $oldestTime = PHP_INT_MAX;

        foreach ($files as $file) {
            $time = File::lastModified($file);
            if ($time < $oldestTime) {
                $oldestTime = $time;
                $oldest = Carbon::createFromTimestamp($time)->format('Y-m-d');
            }
        }

        return $oldest;
    }

    protected function getNewestFile(array $files): ?string
    {
        if (empty($files)) {
            return null;
        }

        $newest = null;
        $newestTime = 0;

        foreach ($files as $file) {
            $time = File::lastModified($file);
            if ($time > $newestTime) {
                $newestTime = $time;
                $newest = Carbon::createFromTimestamp($time)->format('Y-m-d');
            }
        }

        return $newest;
    }

    protected function getLatestLogFile(string $channel): ?string
    {
        $channelPath = $this->channelPaths[$channel] ?? $channel;
        $dir = $this->logsPath . '/' . $channelPath;

        if (!File::isDirectory($dir)) {
            return null;
        }

        $files = File::glob($dir . '/*.log');
        if (empty($files)) {
            return null;
        }

        usort($files, fn($a, $b) => File::lastModified($b) - File::lastModified($a));

        return $files[0];
    }

    protected function displayLastLines(string $file, int $lines): void
    {
        $content = File::get($file);
        $allLines = explode("\n", $content);
        $lastLines = array_slice($allLines, -$lines);

        foreach ($lastLines as $line) {
            if (trim($line)) {
                $this->line($line);
            }
        }
    }

    protected function followLog(string $file): void
    {
        $this->info('Following log (Ctrl+C to stop)...');
        $this->line('');

        $lastSize = File::size($file);

        while (true) {
            clearstatcache(true, $file);
            $currentSize = File::size($file);

            if ($currentSize > $lastSize) {
                $handle = fopen($file, 'r');
                fseek($handle, $lastSize);
                while (!feof($handle)) {
                    $line = fgets($handle);
                    if ($line !== false && trim($line)) {
                        $this->line(rtrim($line));
                    }
                }
                fclose($handle);
                $lastSize = $currentSize;
            }

            usleep(500000); // 0.5 second
        }
    }

    protected function searchInFile(string $file, string $pattern): array
    {
        $matches = [];
        $handle = fopen($file, 'r');
        $lineNum = 0;

        while (($line = fgets($handle)) !== false) {
            $lineNum++;
            if (stripos($line, $pattern) !== false) {
                $matches[] = [
                    'line' => $lineNum,
                    'content' => trim($line),
                ];
            }
        }

        fclose($handle);
        return $matches;
    }
}
