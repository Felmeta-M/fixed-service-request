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

const toFiniteNumberOrNull = (value: unknown): number | null => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : null;
};

const isPaymentRequired = (totalAmount: number | undefined) => {
    if (typeof totalAmount !== 'number') return undefined;
    return totalAmount > 0;
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

    // Pending payment -> allow pay if payment is required, otherwise allow subscribe.
    if (statusNum === 10) {
        if (paymentRequired === false) return { canPay: false, canSubscribe: true, canCancel };
        return { canPay: true, canSubscribe: false, canCancel };
    }

    // Survey completed is the common “next action” point.
    if (statusNum === 5) {
        // If payment is explicitly NOT required (amount === 0), go to subscribe.
        if (paymentRequired === false) {
            return { canPay: false, canSubscribe: true, canCancel };
        }
        // Otherwise (amount > 0 OR amount unknown), go to pay.
        return { canPay: true, canSubscribe: false, canCancel };
    }

    // Default: no actions
    return { canPay: false, canSubscribe: false, canCancel };
};
