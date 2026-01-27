<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark'=> ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function() {
            const appearance = '{{ $appearance ?? "system" }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Suppress Google Maps API deprecation warnings and blocked request errors --}}
    <script>
        (function() {
            // Suppress Google Maps deprecation warnings
            const originalWarn = console.warn;
            const originalError = console.error;

            console.warn = function(...args) {
                const message = args.join(' ');
                // Suppress Google Maps deprecation warnings
                if (
                    message.includes('google.maps.Marker is deprecated') ||
                    message.includes('google.maps.places.AutocompleteService') ||
                    message.includes('google.maps.places.PlacesService') ||
                    message.includes('As of') && message.includes('deprecated')
                ) {
                    return; // Suppress these warnings
                }
                originalWarn.apply(console, args);
            };

            console.error = function(...args) {
                const message = args.join(' ');
                // Suppress ERR_BLOCKED_BY_CLIENT errors (ad blockers, privacy extensions)
                if (
                    message.includes('ERR_BLOCKED_BY_CLIENT') ||
                    message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                    message.includes('maps.googleapis.com') && message.includes('blocked')
                ) {
                    return; // Suppress blocked request errors
                }
                originalError.apply(console, args);
            };
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <title inertia>{{ config('app.name', 'Fixed Services Provisioning System') }}</title>

    <link rel="icon" href="/favicon.ico" sizes="any">
    <!-- <link rel="icon" href="/favicon.svg" type="image/svg+xml"> -->
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

    {{--
            Ziggy Routes - Filtered by config/ziggy.php
            Only whitelisted routes are exposed to the frontend.
            SECURITY: Review config/ziggy.php when adding new frontend routes.
        --}}
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>