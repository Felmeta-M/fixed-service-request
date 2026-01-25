import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { initializeTheme } from './hooks/use-appearance';
import { queryClient } from './lib/query-client';
import RootLayout from './layouts/root-layout';

const appName = import.meta.env.VITE_APP_NAME || 'Fixed Services Provisioning System';

createInertiaApp({
    title: (title) => title ? `${title} | ${appName}` : appName,
    resolve: async (name) => {
        const page = await resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx'));

        // Apply RootLayout as the default persistent layout for all pages
        // This ensures locale context is available and updates on navigation
        const pageModule = page as { default: { layout?: (page: React.ReactNode) => React.ReactNode } };

        if (!pageModule.default.layout) {
            pageModule.default.layout = (page: React.ReactNode) => <RootLayout>{page}</RootLayout>;
        } else {
            // Wrap existing layout with RootLayout
            const existingLayout = pageModule.default.layout;
            pageModule.default.layout = (page: React.ReactNode) => (
                <RootLayout>{existingLayout(page)}</RootLayout>
            );
        }

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <QueryClientProvider client={queryClient}>
                <App {...props} />
                {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
        );
    },
    progress: {
        color: '#3fc478',
    },
});

// This will set light / dark mode on load...
initializeTheme();
