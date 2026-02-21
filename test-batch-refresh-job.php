<?php
/**
 * Test BatchRefreshSurveyOrdersJob.
 * Run: php test-batch-refresh-job.php
 */
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Jobs\BatchRefreshSurveyOrdersJob;

$ids = DB::table('survey_orders')
    ->whereNull('deleted_at')
    ->limit(2)
    ->pluck('id')
    ->all();

if (empty($ids)) {
    echo "No survey orders found. Create at least one survey order first.\n";
    exit(1);
}

echo "Order IDs: " . json_encode($ids) . "\n";
BatchRefreshSurveyOrdersJob::dispatch($ids);
echo "Job dispatched. Run: php artisan queue:work --once\n";
