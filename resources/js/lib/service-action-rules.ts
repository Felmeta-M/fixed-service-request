/**
 * Service Action Rules
 * 
 * NOTE: As of 2026-01, the backend now provides action flags directly in the API response:
 * - can_pay: boolean
 * - can_subscribe: boolean  
 * - can_cancel: boolean
 * - is_paid: boolean
 * 
 * The backend is now the single source of truth for these business rules.
 * Use the backend-provided flags from the survey/service response instead of this function.
 * 
 * This file is kept for:
 * 1. Type exports (ServiceActionFocus, ServiceActionFlags)
 * 2. Legacy fallback if backend flags are not available (edge cases)
 * 
 * @deprecated Use backend-provided can_pay, can_subscribe, can_cancel flags instead
 */

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

/**
 * @deprecated Use backend-provided can_pay, can_subscribe, can_cancel flags instead.
 * The backend is now the single source of truth for action permissions.
 * 
 * This function is kept as a fallback for edge cases where backend flags
 * might not be available (e.g., offline mode, legacy API responses).
 */
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

    // Survey completed is the common "next action" point.
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
