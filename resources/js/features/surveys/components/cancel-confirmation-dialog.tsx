import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

interface CancelConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (cancellationReason?: string) => void;
    loading?: boolean;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    showReasonInput?: boolean;
}

export function CancelConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    loading = false,
    title = 'Cancel Service Request',
    description = 'You are about to cancel this service request. Please read the warning carefully before proceeding.',
    confirmText = 'Yes, Cancel Service',
    cancelText = 'No, Keep It',
    showReasonInput = true,
}: CancelConfirmationDialogProps) {
    const [cancellationReason, setCancellationReason] = useState('');

    const handleConfirm = () => {
        onConfirm(showReasonInput ? cancellationReason : undefined);
        if (showReasonInput) setCancellationReason('');
    };

    return (
        <AlertDialog open={open} onOpenChange={!loading ? onOpenChange : undefined}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <ShieldAlert className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-lg text-red-700">{title}</AlertDialogTitle>
                    </div>

                    <AlertDialogDescription className="text-gray-600">{description}</AlertDialogDescription>
                </AlertDialogHeader>

                {/* Critical Warning Box */}
                <div className="mt-4 rounded-lg border-2 border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-red-800">⚠️ Warning: This action is irreversible!</p>
                            <ul className="list-inside list-disc space-y-1 text-xs text-red-700">
                                <li>Your service request will be permanently cancelled</li>
                                <li>You will need to create a new request if you change your mind</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Reason Input */}
                {showReasonInput && (
                    <div className="mt-4 space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Reason for cancellation <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            minLength={10}
                            maxLength={500}
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            disabled={loading}
                            className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500">{cancellationReason.length}/500 characters</p>
                    </div>
                )}

                {/* Footer Buttons */}
                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel disabled={loading} onClick={() => onOpenChange(false)} className="font-medium">
                        {cancelText}
                    </AlertDialogCancel>

                    <AlertDialogAction 
                        disabled={(showReasonInput && cancellationReason.length < 10) || loading} 
                        onClick={handleConfirm}
                        className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Cancelling...
                            </div>
                        ) : (
                            confirmText
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
