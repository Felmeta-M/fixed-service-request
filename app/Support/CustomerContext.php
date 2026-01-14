<?php

namespace App\Support;

use App\Models\Customer;
use Illuminate\Support\Facades\Auth;

/**
 * CustomerContext - DRY helper for accessing current logged-in customer info.
 * 
 * Provides a centralized way to retrieve customer data across all services
 * (Survey, Subscription, etc.) without duplicating Customer::current() calls.
 */
class CustomerContext
{
    private static ?Customer $cached = null;

    /**
     * Get the current logged-in customer.
     */
    public static function customer(): ?Customer
    {
        if (self::$cached !== null) {
            return self::$cached;
        }

        if (!Auth::guard('api')->check()) {
            return null;
        }

        self::$cached = Customer::current();
        return self::$cached;
    }

    /**
     * Get customer code.
     */
    public static function code(?string $fallback = null): ?string
    {
        return self::customer()?->code ?? $fallback;
    }

    /**
     * Get customer name.
     */
    public static function name(?string $fallback = null): ?string
    {
        return self::customer()?->name ?? $fallback;
    }

    /**
     * Get customer phone number (last 9 digits).
     */
    public static function phone(?string $fallback = null): string
    {
        $phone = self::customer()?->phone_number ?? $fallback;

        if (empty($phone)) {
            return '';
        }

        $digits = preg_replace('/\D/', '', $phone);
        return substr($digits, -9);
    }

    /**
     * Get customer email from contact info.
     */
    public static function email(?string $fallback = null): ?string
    {
        $customer = self::customer();

        if (!$customer) {
            return $fallback;
        }

        // Try to get email from contact array
        $contact = $customer->contact;
        if (is_array($contact) && !empty($contact['email'])) {
            return $contact['email'];
        }

        return $fallback;
    }

    /**
     * Get customer region.
     */
    public static function region(?string $fallback = null): ?string
    {
        return self::customer()?->region ?? $fallback;
    }

    /**
     * Get customer city.
     */
    public static function city(?string $fallback = null): ?string
    {
        return self::customer()?->city ?? $fallback;
    }

    /**
     * Get customer zone.
     */
    public static function zone(?string $fallback = null): ?string
    {
        return self::customer()?->zone ?? $fallback;
    }

    /**
     * Get customer wereda.
     */
    public static function wereda(?string $fallback = null): ?string
    {
        return self::customer()?->wereda ?? $fallback;
    }

    /**
     * Get customer kebele.
     */
    public static function kebele(?string $fallback = null): ?string
    {
        return self::customer()?->kebele ?? $fallback;
    }

    /**
     * Get customer house number.
     */
    public static function houseNo(?string $fallback = null): ?string
    {
        return self::customer()?->house_no ?? $fallback;
    }

    /**
     * Get customer title.
     */
    public static function title(?string $fallback = '1'): ?string
    {
        return self::customer()?->title ?? $fallback;
    }

    /**
     * Get customer gender.
     */
    public static function gender(?string $fallback = '1'): ?string
    {
        return self::customer()?->gender ?? $fallback;
    }

    /**
     * Get customer nationality.
     */
    public static function nationality(?string $fallback = '1'): ?string
    {
        return self::customer()?->nationality ?? $fallback;
    }

    /**
     * Get customer identification type.
     */
    public static function identificationType(?string $fallback = '5'): ?string
    {
        return self::customer()?->identification_type ?? $fallback;
    }

    /**
     * Get customer identification number.
     */
    public static function identificationNumber(?string $fallback = null): ?string
    {
        return self::customer()?->identification_number ?? $fallback;
    }

    /**
     * Get customer birthdate (YmdHis format for BSS).
     */
    public static function birthdate(?string $fallback = '19900101'): string
    {
        $customer = self::customer();
        if ($customer?->birthdate) {
            return $customer->birthdate->format('Ymd');
        }
        return $fallback;
    }

    /**
     * Get customer primary language.
     */
    public static function primaryLanguage(?string $fallback = '2002'): ?string
    {
        return self::customer()?->primary_language ?? $fallback;
    }

    /**
     * Check if user is authenticated.
     */
    public static function isAuthenticated(): bool
    {
        return Auth::guard('api')->check();
    }

    /**
     * Get primary contact info as array.
     */
    public static function primaryContact(array $overrides = []): array
    {
        return [
            'contact_person' => $overrides['contact_person'] ?? self::name(''),
            'contact_no' => $overrides['contact_no'] ?? self::phone(''),
            'contact_email' => $overrides['contact_email'] ?? self::email(''),
        ];
    }

    /**
     * Get secondary contact info as array.
     */
    public static function secondaryContact(array $data = []): array
    {
        return [
            'sec_contact_person' => $data['sec_contact_person'] ?? null,
            'sec_contact_no' => $data['sec_contact_no'] ?? null,
            'sec_contact_email' => $data['sec_contact_email'] ?? null,
        ];
    }

    /**
     * Get address info as array.
     */
    public static function addressInfo(array $overrides = []): array
    {
        $customer = self::customer();

        return [
            'region' => $overrides['region'] ?? self::region('3'),
            'city' => $overrides['city'] ?? self::city('1'),
            'zone' => $overrides['zone'] ?? self::zone('1'),
            'wereda' => $overrides['wereda'] ?? self::wereda('10'),
            'kebele' => $overrides['kebele'] ?? self::kebele('Kebele'),
            'house_no' => $overrides['house_no'] ?? self::houseNo('1234'),
            'street_name' => $overrides['street_name'] ?? ($customer?->street_name ?? 'StreetName'),
            'apartment' => $overrides['apartment'] ?? ($customer?->apartment ?? 'Apartment'),
        ];
    }

    /**
     * Get customer profile info for subscription services.
     * Used in XML building for BSS requests.
     */
    public static function profileInfo(array $overrides = []): array
    {
        $customer = self::customer();

        return [
            // Basic info
            'name' => $overrides['name'] ?? self::name(''),
            'title' => $overrides['title'] ?? self::title('1'),
            'gender' => $overrides['gender'] ?? self::gender('1'),
            'nationality' => $overrides['nationality'] ?? self::nationality('1'),
            'identification_type' => $overrides['identification_type'] ?? self::identificationType('5'),
            'identification_number' => $overrides['identification_number'] ?? self::identificationNumber(''),
            'birthdate' => $overrides['birthdate'] ?? self::birthdate('19900101'),
            'primary_language' => $overrides['primary_language'] ?? self::primaryLanguage('2002'),

            // BSS classification
            'customer_type' => $overrides['customer_type'] ?? self::customerType('2'),
            'customer_category' => $overrides['customer_category'] ?? self::customerCategory('5'),
            'customer_subcategory' => $overrides['customer_subcategory'] ?? self::customerSubcategory('14'),
            'customer_level' => $overrides['customer_level'] ?? self::customerLevel('2'),
            'branch_name' => $overrides['branch_name'] ?? ($customer?->branch_name ?? 'BranchName'),
            'notification_mode' => $overrides['notification_mode'] ?? self::notificationMode('2'),
            'vat_reg_no' => $overrides['vat_reg_no'] ?? ($customer?->vat_reg_no ?? '123456'),

            // Account info
            'bill_cycle' => $overrides['bill_cycle'] ?? ($customer?->bill_cycle ?? '01'),
            'initial_credit' => $overrides['initial_credit'] ?? ($customer?->initial_credit ?? '100'),
            'collection_center' => $overrides['collection_center'] ?? ($customer?->collection_center ?? '10172'),
            'enterprise_customer_name' => $overrides['enterprise_customer_name'] ?? ($customer?->enterprise_customer_name ?? self::name('')),
            'credit_class' => $overrides['credit_class'] ?? self::creditClass('Excellent'),
            'green_list' => $overrides['green_list'] ?? ($customer?->green_list ? '1' : '0'),
            'late_fee_flag' => $overrides['late_fee_flag'] ?? ($customer?->late_fee_flag ? '1' : '0'),

            // Additional profile info
            'place_of_birth' => $overrides['place_of_birth'] ?? ($customer?->place_of_birth ?? '1966'),
            'occupation' => $overrides['occupation'] ?? ($customer?->occupation ?? '1'),
            'education' => $overrides['education'] ?? ($customer?->education ?? '1'),
            'religion' => $overrides['religion'] ?? ($customer?->religion ?? '1'),
            'income' => $overrides['income'] ?? ($customer?->income ?? '7'),
        ];
    }

    // ========================================
    // BSS CLASSIFICATION HELPERS
    // ========================================

    /**
     * Get customer type (BSS).
     */
    public static function customerType(?string $fallback = '2'): string
    {
        return self::customer()?->customer_type ?? $fallback;
    }

    /**
     * Get customer category (BSS).
     */
    public static function customerCategory(?string $fallback = '5'): string
    {
        return self::customer()?->customer_category ?? $fallback;
    }

    /**
     * Get customer subcategory (BSS).
     */
    public static function customerSubcategory(?string $fallback = '14'): string
    {
        return self::customer()?->customer_subcategory ?? $fallback;
    }

    /**
     * Get customer level (BSS).
     */
    public static function customerLevel(?string $fallback = '2'): string
    {
        return self::customer()?->customer_level ?? $fallback;
    }

    /**
     * Get notification mode.
     */
    public static function notificationMode(?string $fallback = '2'): string
    {
        return self::customer()?->notification_mode ?? $fallback;
    }

    /**
     * Get credit class.
     */
    public static function creditClass(?string $fallback = 'Excellent'): string
    {
        return self::customer()?->credit_class ?? $fallback;
    }

    /**
     * Get BSS classification info for subscription services.
     */
    public static function bssClassification(array $overrides = []): array
    {
        return [
            'customer_type' => $overrides['customer_type'] ?? self::customerType('2'),
            'customer_category' => $overrides['customer_category'] ?? self::customerCategory('5'),
            'customer_subcategory' => $overrides['customer_subcategory'] ?? self::customerSubcategory('14'),
            'customer_level' => $overrides['customer_level'] ?? self::customerLevel('2'),
            'notification_mode' => $overrides['notification_mode'] ?? self::notificationMode('2'),
            'credit_class' => $overrides['credit_class'] ?? self::creditClass('Excellent'),
        ];
    }

    /**
     * Get customer name parts (first, middle, last).
     */
    public static function nameParts(): array
    {
        $name = self::name('');
        $parts = explode(' ', trim($name));

        return [
            'first_name' => $parts[0] ?? '',
            'middle_name' => $parts[1] ?? '',
            'last_name' => $parts[2] ?? '',
        ];
    }

    /**
     * Get customer address as formatted string.
     */
    public static function addressString(?string $fallback = ''): string
    {
        $customer = self::customer();
        return $customer?->address_string ?? $fallback;
    }

    /**
     * Clear cached customer (useful for testing or request lifecycle).
     */
    public static function clear(): void
    {
        self::$cached = null;
    }

    /**
     * Hydrate data array with customer info if authenticated.
     * 
     * This method merges customer info into the provided data array,
     * allowing fallback to provided values if customer is not authenticated.
     */
    public static function hydrateData(array $data): array
    {
        if (!self::isAuthenticated()) {
            // Just format phone number if provided
            if (!empty($data['sms_no'])) {
                $digits = preg_replace('/\D/', '', $data['sms_no']);
                $data['sms_no'] = substr($digits, -9);
            }
            if (!empty($data['contact_no'])) {
                $digits = preg_replace('/\D/', '', $data['contact_no']);
                $data['contact_no'] = substr($digits, -9);
            }
            return $data;
        }

        return array_merge($data, [
            'customer_code' => self::code($data['customer_code'] ?? null),
            'name' => self::name($data['name'] ?? null),
            'sms_no' => self::phone($data['sms_no'] ?? null),
            'contact_person' => self::name($data['contact_person'] ?? null),
            'contact_no' => self::phone($data['contact_no'] ?? null),
            'contact_email' => self::email($data['contact_email'] ?? null),
        ]);
    }
}
