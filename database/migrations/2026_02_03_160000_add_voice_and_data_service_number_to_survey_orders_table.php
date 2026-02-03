<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Combo offer ID */
    private const COMBO_OFFER_ID = 102647257;
    /** Voice offer ID */
    private const VOICE_OFFER_ID = 1207609454;
    /** Data offer ID */
    private const DATA_OFFER_ID = 1457567289;

    /**
     * Run the migrations.
     * Survey details show both voice number and data number; store them explicitly.
     * - voice_service_number: Voice line (Combo/Voice = service_number)
     * - data_service_number: Data/FBB line (Combo = fbb_service_number, Data = service_number)
     */
    public function up(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->string('voice_service_number')->nullable()->after('fbb_service_number')
                ->comment('Voice service number (Combo/Voice)');
            $table->string('data_service_number')->nullable()->after('voice_service_number')
                ->comment('Data/FBB service number (Combo/Data)');
        });

        // Backfill: Combo = voice from service_number, data from fbb_service_number; Voice = voice from service_number; Data = data from service_number
        // main_offer_id is stored as string in schema; cast for reliable match across DB drivers
        $combo = (string) self::COMBO_OFFER_ID;
        $voice = (string) self::VOICE_OFFER_ID;
        $data = (string) self::DATA_OFFER_ID;

        DB::table('survey_orders')
            ->where('main_offer_id', $combo)
            ->whereNotNull('service_number')
            ->update(['voice_service_number' => DB::raw('service_number')]);
        DB::table('survey_orders')
            ->where('main_offer_id', $combo)
            ->whereNotNull('fbb_service_number')
            ->update(['data_service_number' => DB::raw('fbb_service_number')]);
        DB::table('survey_orders')
            ->where('main_offer_id', $voice)
            ->whereNotNull('service_number')
            ->update(['voice_service_number' => DB::raw('service_number')]);
        DB::table('survey_orders')
            ->where('main_offer_id', $data)
            ->whereNotNull('service_number')
            ->update(['data_service_number' => DB::raw('service_number')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_orders', function (Blueprint $table) {
            $table->dropColumn(['voice_service_number', 'data_service_number']);
        });
    }
};
