<?php

namespace Database\Seeders;

use App\Models\Language;
use Illuminate\Database\Seeder;

class LanguageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $languages = [
            ['code' => '2060', 'name' => 'Amharic', 'sort_order' => 1],
            ['code' => '2002', 'name' => 'English', 'sort_order' => 2],
            ['code' => '20061', 'name' => 'Oromigna', 'sort_order' => 3],
            ['code' => '20062', 'name' => 'Tigrigna', 'sort_order' => 4],
            ['code' => '20063', 'name' => 'Somali', 'sort_order' => 5],
            ['code' => '20064', 'name' => 'French', 'sort_order' => 6],
            ['code' => '20065', 'name' => 'Arabic', 'sort_order' => 7],
            ['code' => '20066', 'name' => 'Afarigna', 'sort_order' => 8],
            ['code' => '20067', 'name' => 'Aderigna', 'sort_order' => 9],
        ];

        foreach ($languages as $language) {
            Language::updateOrCreate(
                ['code' => $language['code']],
                array_merge($language, ['status' => true])
            );
        }
    }
}
