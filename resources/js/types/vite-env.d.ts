/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_API_PUBLIC_URL: string;
    readonly VITE_NEXTAUTH_SECRET: string;
    readonly VITE_TURNSTILE_SITE_KEY: string;
    readonly WEB_TELEBIRR_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface Window {
    consumerapp?: {
        evaluate: (payload: string) => void;
    };
    handleinitDataCallback?: () => void;
}
