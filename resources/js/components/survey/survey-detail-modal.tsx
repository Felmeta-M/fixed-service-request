import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SurveyDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    survey: any;
}

export default function SurveyDetailModal({ open, onOpenChange, survey }: SurveyDetailModalProps) {
    if (!survey) return null;

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl bg-white">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-gray-900">Survey Details</DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                        Detailed information for survey order <strong>{survey.customer_survey_order_id}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-3 text-sm text-gray-700">
                    <div className="flex justify-between">
                        <span className="font-medium">Service Type:</span>
                        <span>{survey.service_type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Survey Type:</span>
                        {/* <span>{survey.survey_type || 'N/A'}</span> */}
                        <span>{<p>New</p>}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <span className="capitalize">{survey.status}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Created At:</span>
                        <span>{formatDate(survey.created_at)}</span>
                    </div>

                    {(survey.cancellation_reason || survey.rejected_reason) && (
                        <div className="mt-3 rounded-md bg-gray-50 p-3">
                            <span className="mb-1 block text-sm font-semibold text-gray-800">
                                {survey.status?.toLowerCase() === 'cancelled' ? 'Cancellation Reason:' : 'Rejection Reason:'}
                            </span>
                            <p className="text-gray-600">{survey.cancellation_reason || survey.rejected_reason}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
