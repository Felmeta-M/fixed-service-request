import { Dialog, Transition } from '@headlessui/react';
import { AlertCircle, X } from 'lucide-react';
import { Fragment, useState } from 'react';

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
        if (showReasonInput) {
            setCancellationReason('');
        }
    };

    return (
        <Transition show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !loading && onOpenChange(false)}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="bg-opacity-25 fixed inset-0 bg-black backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                                            <AlertCircle className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                                            {title}
                                        </Dialog.Title>
                                    </div>

                                    {!loading && (
                                        <button
                                            onClick={() => onOpenChange(false)}
                                            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <p className="mb-4 text-sm leading-relaxed text-gray-600">{description}</p>

                                    {showReasonInput && (
                                        <div className="space-y-2">
                                            <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700">
                                                Reason for cancellation <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                id="cancellationReason"
                                                rows={3}
                                                minLength={20}
                                                value={cancellationReason}
                                                onChange={(e) => setCancellationReason(e.target.value)}
                                                placeholder="Please provide a reason for cancelling this survey..."
                                                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                                disabled={loading}
                                            />
                                            <p className="text-xs text-gray-500">Maximum 500 characters. {cancellationReason.length}/500</p>
                                        </div>
                                    )}

                                    <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3">
                                        <div className="flex items-start space-x-2">
                                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                                            <p className="text-xs text-orange-700">
                                                <strong>Note:</strong> Once cancelled, this survey order cannot be reactivated.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => onOpenChange(false)}
                                        className="mt-3 inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0"
                                    >
                                        {cancelText}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={!cancellationReason}
                                        onClick={handleConfirm}
                                        className="inline-flex justify-center rounded-lg border border-transparent bg-orange-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-orange-700 hover:shadow-md focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                <span>Cancelling...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <span>{confirmText}</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

export default CancelConfirmationDialog;
