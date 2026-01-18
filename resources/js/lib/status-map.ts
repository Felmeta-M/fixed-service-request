/**
 * Service Provision Status Map
 * 
 * Uses string-based keys matching the backend API response labels.
 * The backend sends status as a string label (e.g., "Survey Completed", "Order Completed").
 */
export const ServiceProvisionStatus = {
    // Backend status labels (from API response)
    'Created': { label: 'Created', text: 'text-gray-700', bg: 'bg-gray-400', variant: 'success' as const },
    'Processing': { label: 'Processing', text: 'text-blue-700', bg: 'bg-blue-400', variant: 'success' as const },
    'Suspended': { label: 'Suspended', text: 'text-orange-700', bg: 'bg-orange-400', variant: 'warning' as const },
    'Waiting': { label: 'Waiting', text: 'text-yellow-700', bg: 'bg-yellow-400', variant: 'warning' as const },
    'Failed': { label: 'Failed', text: 'text-red-700', bg: 'bg-red-400', variant: 'warning' as const },
    'Ready': { label: 'Ready', text: 'text-indigo-700', bg: 'bg-indigo-400', variant: 'success' as const },
    'Cancelled': { label: 'Cancelled', text: 'text-rose-700', bg: 'bg-rose-400', variant: 'warning' as const },
    'Paid': { label: 'Paid', text: 'text-emerald-700', bg: 'bg-emerald-400', variant: 'success' as const },
    'Refund': { label: 'Refund', text: 'text-teal-700', bg: 'bg-teal-400', variant: 'success' as const },
    // Survey-specific statuses from backend
    'Survey Completed': { label: 'Survey Completed', text: 'text-et-green', bg: 'bg-et-green', variant: 'success' as const },
    'Order Completed': { label: 'Order Completed', text: 'text-et-green', bg: 'bg-et-green', variant: 'success' as const },
    'Waiting Survey': { label: 'Waiting Survey', text: 'text-yellow-700', bg: 'bg-yellow-400', variant: 'warning' as const },
    'Order Waiting': { label: 'Order Waiting', text: 'text-yellow-700', bg: 'bg-yellow-400', variant: 'warning' as const },
    'Pending Payment': { label: 'Pending Payment', text: 'text-purple-700', bg: 'bg-purple-400', variant: 'warning' as const },
    // Fallback for unknown status
    'Unknown': { label: 'Unknown', text: 'text-gray-700', bg: 'bg-gray-200', variant: 'default' as const },
} as const;

export type StatusKey = keyof typeof ServiceProvisionStatus;

/**
 * Get status info from a status string
 * Returns the matched status or 'Unknown' fallback
 */
export const getStatusInfo = (status: string | number | null | undefined) => {
    if (status == null) return ServiceProvisionStatus['Unknown'];

    const statusStr = String(status);

    // Direct match with backend label
    if (statusStr in ServiceProvisionStatus) {
        return ServiceProvisionStatus[statusStr as StatusKey];
    }

    // Fallback for unknown status
    return ServiceProvisionStatus['Unknown'];
};

/**
 * Get badge variant for a status string
 */
export const getStatusBadgeVariant = (status: string | number | null | undefined) => {
    return getStatusInfo(status).variant;
};

/**
 * List of all available status options for filters
 */
export const statusOptions = Object.keys(ServiceProvisionStatus).filter(
    (key) => key !== 'Unknown'
) as StatusKey[];
