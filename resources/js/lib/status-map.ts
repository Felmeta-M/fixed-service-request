/**
 * Service Request Status Map (Decoupled Design)
 * 
 * Uses stable status CODES from backend (status_code field) for logic.
 * Display labels are defined here in the frontend - can be changed without backend changes.
 * 
 * Backend sends:
 *   - status_code: Stable code for logic (e.g., "assessment_complete")
 *   - status: Display hint (optional, frontend can override)
 */

// Stable status codes from backend (used for logic/filtering)
export type StatusCode =
    | 'created'
    | 'processing'
    | 'waiting'
    | 'waiting_assessment'
    | 'assessment_complete'
    | 'device_selection'
    | 'pending_payment'
    | 'paid'
    | 'ready'
    | 'order_waiting'
    | 'order_completed'
    | 'failed'
    | 'cancelled'
    | 'suspended'
    | 'refund'
    | 'unknown';

// Status configuration with user-friendly labels
export const StatusConfig: Record<StatusCode, {
    label: string;      // User-friendly display label
    text: string;       // Text color class
    bg: string;         // Background color class
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
    // Initial/Processing states
    'created': { label: 'Created', text: 'text-white', bg: 'bg-et-blue', variant: 'default' },
    'processing': { label: 'Processing', text: 'text-white', bg: 'bg-et-light-blue', variant: 'default' },
    'waiting': { label: 'Waiting', text: 'text-white', bg: 'bg-et-yellow', variant: 'secondary' },

    // Assessment phase (user-friendly labels - no "Survey")
    'waiting_assessment': { label: 'In Progress', text: 'text-white', bg: 'bg-et-yellow', variant: 'secondary' },
    'assessment_complete': { label: 'Resource Allocated', text: 'text-white', bg: 'bg-et-green', variant: 'default' },

    // Device & Payment
    'device_selection': { label: 'Select Device', text: 'text-white', bg: 'bg-et-light-blue', variant: 'secondary' },
    'pending_payment': { label: 'Payment Required', text: 'text-white', bg: 'bg-et-light-blue', variant: 'secondary' },
    'paid': { label: 'Paid', text: 'text-white', bg: 'bg-et-green', variant: 'default' },
    'ready': { label: 'Ready', text: 'text-white', bg: 'bg-et-light-green', variant: 'default' },

    // Order phase
    'order_waiting': { label: 'Order Processing', text: 'text-white', bg: 'bg-et-yellow', variant: 'secondary' },
    'order_completed': { label: 'Service Activated', text: 'text-white', bg: 'bg-et-green', variant: 'default' },

    // Terminal states
    'failed': { label: 'Failed', text: 'text-white', bg: 'bg-et-red', variant: 'destructive' },
    'cancelled': { label: 'Cancelled', text: 'text-white', bg: 'bg-et-red', variant: 'destructive' },
    'suspended': { label: 'Suspended', text: 'text-white', bg: 'bg-et-yellow', variant: 'secondary' },
    'refund': { label: 'Refunded', text: 'text-white', bg: 'bg-et-blue', variant: 'default' },

    // Fallback
    'unknown': { label: 'Unknown', text: 'text-muted-foreground', bg: 'bg-muted', variant: 'outline' },
};

// Legacy status labels from backend (for backward compatibility during transition)
const legacyLabelToCode: Record<string, StatusCode> = {
    'Created': 'created',
    'Processing': 'processing',
    'Waiting': 'waiting',
    'Waiting Survey': 'waiting_assessment',
    'Survey Completed': 'assessment_complete',
    'Device Selection': 'device_selection',
    'Pending Payment': 'pending_payment',
    'Paid': 'paid',
    'Ready': 'ready',
    'Order Waiting': 'order_waiting',
    'Order Completed': 'order_completed',
    'Failed': 'failed',
    'Cancelled': 'cancelled',
    'Suspended': 'suspended',
    'Refund': 'refund',
};

/**
 * Get status info from either status_code or legacy status label.
 * Prefers status_code if available, falls back to parsing legacy label.
 */
export const getStatusInfo = (
    statusOrCode: string | number | null | undefined,
    statusCode?: string | null
) => {
    // Prefer status_code if provided
    if (statusCode && statusCode in StatusConfig) {
        return StatusConfig[statusCode as StatusCode];
    }

    if (statusOrCode == null) return StatusConfig['unknown'];

    const statusStr = String(statusOrCode);

    // Try as status code first
    if (statusStr in StatusConfig) {
        return StatusConfig[statusStr as StatusCode];
    }

    // Try as legacy label
    const mappedCode = legacyLabelToCode[statusStr];
    if (mappedCode) {
        return StatusConfig[mappedCode];
    }

    // Fallback
    return StatusConfig['unknown'];
};

/**
 * Get badge variant for a status
 */
export const getStatusBadgeVariant = (
    statusOrCode: string | number | null | undefined,
    statusCode?: string | null
) => {
    return getStatusInfo(statusOrCode, statusCode).variant;
};

/**
 * Status categories for filtering/grouping (using stable codes)
 */
export const STATUS_CATEGORIES = {
    ACTIVE: ['processing', 'waiting', 'waiting_assessment', 'order_waiting', 'ready', 'paid', 'pending_payment', 'device_selection'],
    PENDING: ['created'],
    COMPLETED: ['assessment_complete', 'order_completed', 'failed', 'cancelled', 'refund'],
    SUSPENDED: ['suspended'],
} as const;

/**
 * List of all available status options for filters (user-friendly labels)
 */
export const statusOptions = Object.entries(StatusConfig)
    .filter(([code]) => code !== 'unknown')
    .map(([code, config]) => ({
        code: code as StatusCode,
        label: config.label,
    }));

// ===== BACKWARD COMPATIBILITY =====
// Keep old exports for gradual migration

/** @deprecated Use StatusConfig instead */
export const ServiceProvisionStatus = {
    'Created': StatusConfig['created'],
    'Processing': StatusConfig['processing'],
    'Suspended': StatusConfig['suspended'],
    'Waiting': StatusConfig['waiting'],
    'Failed': StatusConfig['failed'],
    'Ready': StatusConfig['ready'],
    'Cancelled': StatusConfig['cancelled'],
    'Paid': StatusConfig['paid'],
    'Pending': StatusConfig['pending_payment'],
    'Refund': StatusConfig['refund'],
    'Survey Completed': StatusConfig['assessment_complete'],
    'Order Completed': StatusConfig['order_completed'],  // Now displays "Service Activated"
    'Waiting Survey': StatusConfig['waiting_assessment'],
    'Order Waiting': StatusConfig['order_waiting'],
    'Pending Payment': StatusConfig['pending_payment'],
    'Device Selection': StatusConfig['device_selection'],
    'Unknown': StatusConfig['unknown'],
} as const;

/** @deprecated Use StatusCode instead */
export type StatusKey = keyof typeof ServiceProvisionStatus;
