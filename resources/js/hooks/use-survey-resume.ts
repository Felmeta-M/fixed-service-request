import { useSurveyList } from '@/features/surveys/hooks/use-surveys';
import { useMemo } from 'react';

// Survey statuses that indicate the survey can be resumed
// After admin approval, status changes to Ready (2)
const RESUMABLE_STATUSES = ['Ready', '2', 'Approved', 'Completed'];

export interface ResumableSurvey {
    id: string;
    customer_survey_order_id: string;
    customer_subscription_order_id?: string | null;
    status: string;
    main_offer_id: string;
    bandwidth?: string;
    service_type?: string;
    created_at: string;
    survey_is_manual?: boolean;
    can_pay?: boolean;
    can_subscribe?: boolean;
}

/**
 * Hook to get surveys that can be resumed (approved manual surveys)
 * These are surveys with survey_is_manual = true and status = Ready/Approved
 */
export function useResumableSurveys() {
    const surveyListQuery = useSurveyList();

    const surveys = useMemo(() => {
        return surveyListQuery.data?.pages.flatMap((page) => page.data) ?? [];
    }, [surveyListQuery.data]);

    const resumableSurveys = useMemo((): ResumableSurvey[] => {
        return surveys.filter((survey) => {
            const statusStr = String(survey.status ?? '');
            // A survey is resumable if:
            // 1. It's in a "Ready" or "Approved" status (approved by admin)
            // 2. It can be paid or subscribed (backend flags)
            const isResumableStatus = RESUMABLE_STATUSES.includes(statusStr);
            const canContinue = survey.can_pay || survey.can_subscribe;

            return isResumableStatus && canContinue;
        }) as ResumableSurvey[];
    }, [surveys]);

    return {
        resumableSurveys,
        loading: surveyListQuery.isLoading,
        error: surveyListQuery.error?.message || null,
        refetch: surveyListQuery.refetch,
    };
}

/**
 * Check if a specific survey can be resumed
 */
export function canResumeSurvey(survey: {
    status?: string | number | null;
    can_pay?: boolean;
    can_subscribe?: boolean;
}): boolean {
    const statusStr = String(survey.status ?? '');
    const isResumableStatus = RESUMABLE_STATUSES.includes(statusStr);
    const canContinue = survey.can_pay || survey.can_subscribe;

    return isResumableStatus && canContinue;
}
