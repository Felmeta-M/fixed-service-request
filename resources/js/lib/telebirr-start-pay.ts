import { showErrorToast } from '@/lib/toast-helpers';

type StartTelebirrPaymentParams = {
    rawRequest: string;
};

const DEFAULT_WEB_TELEBIRR_BASE_URL = 'https://superapp.ethiomobilemoney.et:38443/payment/web/paygate?';

function buildBrowserCheckoutUrl(rawRequest: string): string | null {
    const trimmed = rawRequest.trim();
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    const baseUrl =
        import.meta.env.VITE_WEB_TELEBIRR_BASE_URL?.trim() ||
        DEFAULT_WEB_TELEBIRR_BASE_URL;

    if (!baseUrl) {
        return null;
    }

    return `${baseUrl}${trimmed}&version=1.0&trade_type=Checkout`;
}

export function startTelebirrPayment({ rawRequest }: StartTelebirrPaymentParams): boolean {
    if (!rawRequest?.trim()) {
        showErrorToast('Payment order created but raw request is empty');
        return false;
    }

    // SuperApp injects window.consumerapp. If present, use js_fun_start_pay.
    if (window.consumerapp?.evaluate) {
        const callbackName = 'handleinitDataCallback';
        window[callbackName] = () => {
            window.location.href = window.location.origin;
        };

        const payload = JSON.stringify({
            functionName: 'js_fun_start_pay',
            params: {
                rawRequest: rawRequest.trim(),
                functionCallBackName: callbackName,
            },
        });

        window.consumerapp.evaluate(payload);
        return true;
    }

    // Otherwise normal browser: open Telebirr H5 URL constructed on frontend.
    const checkoutUrl = buildBrowserCheckoutUrl(rawRequest);
    if (!checkoutUrl) {
        showErrorToast('Telebirr web base URL is not configured');
        return false;
    }

    window.location.href = checkoutUrl;
    return true;
}
