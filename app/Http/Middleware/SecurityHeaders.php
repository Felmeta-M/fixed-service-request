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
        
        // Base script sources
        $scriptSources = ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"];
        
        // Base connect sources
        $connectSources = ["'self'", "https:"];
        
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

        $directives = [
            "default-src 'self'",
            "script-src " . implode(' ', $scriptSources),
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "connect-src " . implode(' ', $connectSources),
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
