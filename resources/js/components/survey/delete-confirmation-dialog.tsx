import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, X } from 'lucide-react';
import { Fragment } from 'react';

interface DeleteConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    loading?: boolean;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
}

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    loading = false,
    title = 'Delete Survey Order',
    description = 'This will permanently delete the survey order from the system. This action cannot be undone.',
    confirmText = 'Yes, Delete',
    cancelText = 'No, Keep It',
}: DeleteConfirmationDialogProps) {
    return (
        <Transition show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !loading && onOpenChange(false)}>
                {/* Backdrop */}
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
                                {/* Header */}
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
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

                                {/* Content */}
                                <div className="mb-6">
                                    <p className="text-sm leading-relaxed text-gray-600">{description}</p>

                                    {/* Warning Message */}
                                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                                        <div className="flex items-start space-x-2">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                                            <p className="text-xs text-red-700">
                                                <strong>Warning:</strong> This action is permanent and cannot be reversed. All survey data will be
                                                lost.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
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
                                        disabled={loading}
                                        onClick={onConfirm}
                                        className="inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                <span>Deleting...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <AlertTriangle className="h-4 w-4" />
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

export default DeleteConfirmationDialog;
