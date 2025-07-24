<?php


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CustomerType;
use App\Models\CustomerCategory;
use App\Models\CustomerSubcategory;

class CustomerTypeCategorySubcategorySeeder extends Seeder
{
    public function run()
    {
        // Truncate old data
        // \DB::table('customer_subcategories')->truncate();
        // \DB::table('customer_categories')->truncate();
        // \DB::table('customer_types')->truncate();

        // Helper for creating records with hierarchy
        function create($typeName, $typeValue, $categories)
        {
            $type = CustomerType::create(['name' => $typeName, 'api_value' => $typeValue]);

            foreach ($categories as $cat) {
                $category = CustomerCategory::create([
                    'customer_type_id' => $type->id,
                    'name' => $cat['name'],
                    'api_value' => $cat['value'],
                ]);

                foreach ($cat['subcategories'] as $sub) {
                    CustomerSubcategory::create([
                        'customer_category_id' => $category->id,
                        'name' => $sub['name'],
                        'api_value' => $sub['value'],
                    ]);
                }
            }
        }

        // === Individual ===
        create('Individual', 1, [
            [
                'name' => 'Residential',
                'value' => 1,
                'subcategories' => [
                    ['name' => 'Residential', 'value' => 1],
                ],
            ],
            [
                'name' => 'Ethio Employee',
                'value' => 2,
                'subcategories' => [
                    ['name' => 'Active', 'value' => 2],
                    ['name' => 'Retired', 'value' => 3],
                ],
            ],
        ]);

        // === Enterprise ===
        create('Enterprise', 2, [
            [
                'name' => 'Small office Home office/SOHO',
                'value' => 10,
                'subcategories' => [
                    ['name' => 'Small office Home office/SOHO', 'value' => 24],
                ],
            ],
            [
                'name' => 'ethio Telecom',
                'value' => 3,
                'subcategories' => [
                    ['name' => 'NGOs', 'value' => 10],
                    ['name' => 'Financial Institutions', 'value' => 4],
                    ['name' => 'Government Administrative', 'value' => 5],
                    ['name' => 'Public Service Enterprises', 'value' => 6],
                    ['name' => 'Private Service Enteprises', 'value' => 8],
                    ['name' => 'International Org and Embassies', 'value' => 9],
                ],
            ],
            [
                'name' => 'Public Service',
                'value' => 6,
                'subcategories' => [
                    ['name' => 'Pay Staion', 'value' => 16],
                    ['name' => 'Pay Phone', 'value' => 17],
                ],
            ],
            [
                'name' => 'Corporate Business',
                'value' => 7,
                'subcategories' => [
                    ['name' => 'Financial Institutions', 'value' => 18],
                    ['name' => 'Government', 'value' => 19],
                    ['name' => 'Production', 'value' => 20],
                    ['name' => 'International Org and NGOs', 'value' => 21],
                    ['name' => 'Service Enterprises', 'value' => 22],
                ],
            ],
            [
                'name' => 'Large Enterprise',
                'value' => 8,
                'subcategories' => [
                    ['name' => 'Financial Institutions', 'value' => 18],
                    ['name' => 'Government', 'value' => 19],
                    ['name' => 'Production', 'value' => 20],
                    ['name' => 'International Org and NGOs', 'value' => 21],
                    ['name' => 'Service Enterprises', 'value' => 22],
                ],
            ],
            [
                'name' => 'Small and Medium Enterprise/SME',
                'value' => 9,
                'subcategories' => [
                    ['name' => 'Small and Medium Enterprise/SME', 'value' => 23],
                ],
            ],
        ]);
    }
}
