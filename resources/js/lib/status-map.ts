/**
 * Service Provision Status Map
 * 
 * Uses string-based keys matching the backend API response labels.
 * The backend sends status as a string label (e.g., "Survey Completed", "Order Completed").
 */
export const ServiceProvisionStatus = {
    // Backend status labels (from API response) - Using ET Brand Colors only
    'Created': { label: 'Created', text: 'text-white', bg: 'bg-et-blue', variant: 'default' as const },
    'Processing': { label: 'Processing', text: 'text-white', bg: 'bg-et-light-blue', variant: 'default' as const },
    'Suspended': { label: 'Suspended', text: 'text-white', bg: 'bg-et-yellow', variant: 'secondary' as const },
    'Waiting': { label: 'Waiting', text: 'text-white', bg: 'bg-et-yellow', variant: 'secondary' as const },
    'Failed': { label: 'Failed', text: 'text-white', bg: 'bg-et-red', variant: 'destructive' as const },
    'Ready': { label: 'Ready', text: 'text-white', bg: 'bg-et-light-green', variant: 'default' as const },
    'Cancelled': { label: 'Cancelled', text: 'text-white', bg: 'bg-et-red', variant: 'destructive' as const },
    'Paid': { label: 'Paid', text: 'text-white', bg: 'bg-et-green', variant: 'default' as const },
    'Pending': { label: 'Pending', text: 'text-white', bg: 'bg-et-yellow', variant: 'secondary' as const },
    'Refund': { label: 'Refund', text: 'text-white', bg: 'bg-et-blue', variant: 'default' as const },
    // Survey-specific statuses from backend
    'Survey Completed': { label: 'Survey Completed', text: 'text-white', bg: 'bg-et-green', variant: 'default' as const },
    'Order Completed': { label: 'Order Completed', text: 'text-white', bg: 'bg-et-green', variant: 'default' as const },
    'Waiting Survey': { label: 'Waiting Survey', text: 'text-white', bg: 'bg-et-yellow', variant: 'secondary' as const },
    'Order Waiting': { label: 'Order Waiting', text: 'text-white', bg: 'bg-et-yellow', variant: 'secondary' as const },
    'Pending Payment': { label: 'Pending Payment', text: 'text-white', bg: 'bg-et-light-blue', variant: 'secondary' as const },
    // Manual survey specific statuses
    'Device Selection': { label: 'Device Selection', text: 'text-white', bg: 'bg-et-light-blue', variant: 'secondary' as const },
    // Fallback for unknown status
    'Unknown': { label: 'Unknown', text: 'text-muted-foreground', bg: 'bg-muted', variant: 'outline' as const },
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
