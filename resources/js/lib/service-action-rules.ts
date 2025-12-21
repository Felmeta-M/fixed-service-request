export type ServiceActionFocus = 'payment' | 'subscribe';

export type ServiceActionFlags = {
    canPay: boolean;
    canSubscribe: boolean;
    canCancel: boolean;
};

type GetServiceActionFlagsInput = {
    status?: unknown;
    mainOfferId?: unknown;
    totalAmount?: number;
};

const INTERNET_OFFER_ID = '1457567289';

const toFiniteNumberOrNull = (value: unknown): number | null => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : null;
};

const isPaymentRequired = (totalAmount: number | undefined) => {
    if (typeof totalAmount !== 'number') return undefined;
    return totalAmount > 0;
};

const requiresPaymentByOffer = (mainOfferId: unknown) => {
    const id = mainOfferId == null ? '' : String(mainOfferId);
    // Existing behavior: Internet (1457567289) is treated as “no pay step” and goes straight to subscribe.
    return id !== INTERNET_OFFER_ID;
};

export const getServiceActionFlags = ({ status, mainOfferId, totalAmount }: GetServiceActionFlagsInput): ServiceActionFlags => {
    const statusNum = toFiniteNumberOrNull(status);

    // Cancellation rules (keep existing intent: cancellable in Waiting Survey & Survey Completed)
    const canCancel = statusNum === 3 || statusNum === 5;

    // If we don't know the status yet, be conservative on list/detail: hide pay/subscribe.
    if (statusNum == null) {
        return { canPay: false, canSubscribe: false, canCancel };
    }

    // Terminal state
    if (statusNum === 14) {
        return { canPay: false, canSubscribe: false, canCancel: false };
    }

    // Paid -> only subscription remains
    if (statusNum === 11) {
        return { canPay: false, canSubscribe: true, canCancel };
    }

    const paymentRequired = isPaymentRequired(totalAmount);
    const paymentStepApplies = requiresPaymentByOffer(mainOfferId);

    // Pending payment -> allow pay if payment is required, otherwise allow subscribe.
    if (statusNum === 10) {
        if (paymentRequired === false) return { canPay: false, canSubscribe: true, canCancel };
        return { canPay: true, canSubscribe: false, canCancel };
    }

    // Survey completed is the common “next action” point.
    if (statusNum === 5) {
        // If payment step applies and the amount isn't known, we still follow offer rule.
        if (paymentStepApplies && paymentRequired !== false) {
            return { canPay: true, canSubscribe: false, canCancel };
        }

        return { canPay: false, canSubscribe: true, canCancel };
    }

    // Default: no actions
    return { canPay: false, canSubscribe: false, canCancel };
};
