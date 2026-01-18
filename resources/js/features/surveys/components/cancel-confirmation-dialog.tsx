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
import { AlertCircle } from 'lucide-react';
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
    title = 'Cancel Survey Order',
    description = 'Are you sure you want to cancel this survey order? This action cannot be undone.',
    confirmText = 'Yes, Cancel',
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-full ">
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                    </div>

                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>

                {/* Reason Input */}
                {showReasonInput && (
                    <div className="mt-4 space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Reason for cancellation <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            minLength={20}
                            maxLength={500}
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            placeholder="Please provide a reason for cancelling this survey..."
                            disabled={loading}
                            className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus-visible:ring-orange-500"
                        />
                        <p className="text-xs text-gray-500">{cancellationReason.length}/500</p>
                    </div>
                )}

                {/* Warning Note */}
                <div className="mt-4 rounded-md border p-3">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <p className="text-xs text-orange-700">
                            <strong>Note:</strong> Once cancelled, this survey order cannot be reactivated.
                        </p>
                    </div>
                </div>

                {/* Footer Buttons */}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading} onClick={() => onOpenChange(false)}>
                        {cancelText}
                    </AlertDialogCancel>

                    <AlertDialogAction disabled={showReasonInput && cancellationReason.length < 2} onClick={handleConfirm}>
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
