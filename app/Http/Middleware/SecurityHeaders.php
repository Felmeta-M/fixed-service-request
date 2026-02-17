<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Security Headers Middleware
 *
 * Adds essential security headers to all responses:
 * - Content-Security-Policy (CSP)
 * - Strict-Transport-Security (HSTS)
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 */
class SecurityHeaders
{
    /**
     * Headers to add to responses
     */
    protected array $headers = [];

    public function __construct()
    {
        $this->headers = $this->buildHeaders();
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        foreach ($this->headers as $header => $value) {
            if ($value !== null) {
                $response->headers->set($header, $value);
            }
        }

        // Remove headers that expose server info
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }

    /**
     * Build security headers based on environment
     */
    protected function buildHeaders(): array
    {
        $isProduction = app()->isProduction();
        // true = Laravel sends no CSP (nginx sends it). false = Laravel sends CSP.
        // Use true when nginx sends CSP, so the browser only gets one CSP.
        $disableHttpSecurity = env('DISABLE_HTTP_SECURITY', true);

        if ($disableHttpSecurity) {
            return [];
        }

        return [
            // Prevent MIME type sniffing
            'X-Content-Type-Options' => 'nosniff',

            // Prevent clickjacking
            'X-Frame-Options' => 'SAMEORIGIN',

            // XSS protection (legacy but still useful)
            'X-XSS-Protection' => '1; mode=block',

            // Control referrer information
            'Referrer-Policy' => 'strict-origin-when-cross-origin',

            // HSTS - Force HTTPS (only in production)
            'Strict-Transport-Security' => $isProduction
                ? 'max-age=31536000; includeSubDomains; preload'
                : null,

            // Content Security Policy (only enforce strict CSP in production)
            'Content-Security-Policy' => $isProduction ? $this->buildCsp() : null,

            // Permissions Policy (formerly Feature-Policy)
            'Permissions-Policy' => $this->buildPermissionsPolicy(),

            // Prevent caching of sensitive data
            'Cache-Control' => 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma' => 'no-cache',

            // Cross-Origin policies (these can interfere with dev tools like Vite,
            // so only enable them in production)
            'Cross-Origin-Opener-Policy' => $isProduction ? 'same-origin' : null,
            'Cross-Origin-Embedder-Policy' => $isProduction ? 'require-corp' : null,
            'Cross-Origin-Resource-Policy' => $isProduction ? 'same-origin' : null,
        ];
    }

    /**
     * Build Content Security Policy header
     */
    protected function buildCsp(): string
    {
        $isProduction = app()->isProduction();
        $vitePort = config('vite.port', 5173);

        // Base script sources (reCAPTCHA: google.com + recaptcha.net; Turnstile: challenges.cloudflare.com)
        $scriptSources = ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://maps.googleapis.com", "https://www.google.com", "https://www.gstatic.com", "https://www.recaptcha.net", "https://challenges.cloudflare.com"];

        // Base connect sources (Turnstile: challenges.cloudflare.com for widget API)
        $connectSources = ["'self'", "https:", "https://challenges.cloudflare.com"];

        // In development, allow Vite dev server (both IPv4 and IPv6 localhost)
        if (!$isProduction) {
            $viteUrls = [
                "http://localhost:{$vitePort}",
                "http://127.0.0.1:{$vitePort}",
                "http://[::1]:{$vitePort}",
                "ws://localhost:{$vitePort}",
                "ws://127.0.0.1:{$vitePort}",
                "ws://[::1]:{$vitePort}",
            ];

            // Add Vite URLs to script sources
            $scriptSources = array_merge($scriptSources, $viteUrls);

            // Add Vite URLs to connect sources
            $connectSources = array_merge($connectSources, $viteUrls);
        }

        $scriptSourcesStr = implode(' ', $scriptSources);
        $directives = [
            "default-src 'self'",
            "script-src " . $scriptSourcesStr,
            "script-src-elem " . $scriptSourcesStr,
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "connect-src " . implode(' ', $connectSources),
            "frame-src 'self' https://www.google.com https://www.recaptcha.net https://challenges.cloudflare.com",
            "frame-ancestors 'self'",
            "form-action 'self'",
            "base-uri 'self'",
            "object-src 'none'",
        ];

        // Add report-uri in production
        if ($isProduction && config('security.csp_report_uri')) {
            $directives[] = "report-uri " . config('security.csp_report_uri');
        }

        return implode('; ', $directives);
    }

    /**
     * Build Permissions Policy header
     */
    protected function buildPermissionsPolicy(): string
    {
        return implode(', ', [
            'accelerometer=()',
            'camera=()',
            'geolocation=()',
            'gyroscope=()',
            'magnetometer=()',
            'microphone=()',
            'payment=(self)',
            'usb=()',
        ]);
    }
}
