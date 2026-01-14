<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Supported locales for the application.
     */
    protected array $supportedLocales = ['en', 'am', 'om', 'so', 'ti', 'aa'];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->determineLocale($request);

        // Log::debug('SetLocale middleware', [
        //     'determined_locale' => $locale,
        //     'session_locale' => Session::get('locale'),
        //     'url' => $request->url(),
        // ]);

        App::setLocale($locale);
        Session::put('locale', $locale);

        return $next($request);
    }

    /**
     * Determine the locale to use based on session, header, or default.
     */
    protected function determineLocale(Request $request): string
    {
        // 1. Check if locale is stored in session (user's explicit choice)
        if (Session::has('locale')) {
            $sessionLocale = Session::get('locale');
            if ($this->isSupported($sessionLocale)) {
                return $sessionLocale;
            }
        }

        // 2. Check query parameter (for direct language switching via URL)
        if ($request->has('lang')) {
            $queryLocale = $request->query('lang');
            if ($this->isSupported($queryLocale)) {
                return $queryLocale;
            }
        }

        // 3. Check Accept-Language header from browser
        $browserLocale = $this->parseAcceptLanguage($request);
        if ($browserLocale && $this->isSupported($browserLocale)) {
            return $browserLocale;
        }

        // 4. Fall back to app default locale
        return config('app.locale', 'en');
    }

    /**
     * Check if a locale is supported.
     */
    protected function isSupported(?string $locale): bool
    {
        return $locale && in_array($locale, $this->supportedLocales);
    }

    /**
     * Parse the Accept-Language header to find a supported locale.
     */
    protected function parseAcceptLanguage(Request $request): ?string
    {
        $acceptLanguage = $request->header('Accept-Language');

        if (!$acceptLanguage) {
            return null;
        }

        // Parse the Accept-Language header
        $languages = [];
        foreach (explode(',', $acceptLanguage) as $part) {
            $part = trim($part);
            $quality = 1.0;

            if (str_contains($part, ';q=')) {
                [$part, $q] = explode(';q=', $part);
                $quality = (float) $q;
            }

            // Extract the primary language tag (e.g., 'en' from 'en-US')
            $lang = strtolower(substr(trim($part), 0, 2));
            $languages[$lang] = $quality;
        }

        // Sort by quality (highest first)
        arsort($languages);

        // Return the first supported language
        foreach (array_keys($languages) as $lang) {
            if ($this->isSupported($lang)) {
                return $lang;
            }
        }

        return null;
    }
}
