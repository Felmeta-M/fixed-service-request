import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

type DialogName = 'cancel' | 'delete' | 'upgrade' | 'downgrade' | 'detail' | string;

interface DialogStore {
    activeDialog: DialogName | null;
    dialogData: Record<string, any> | null;
    isTerminateAction: boolean;

    openDialog: (name: DialogName, data?: Record<string, any>) => void;
    closeDialog: () => void;
    isDialogOpen: (name: DialogName) => boolean;
    setIsTerminateAction: (val: boolean) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useDialogStore = create<DialogStore>()(
    devtools(
        (set, get) => ({
            activeDialog: null,
            dialogData: null,
            isTerminateAction: false,

            openDialog: (name, data = undefined) =>
                set(
                    { activeDialog: name, dialogData: data ?? null },
                    undefined,
                    `openDialog:${name}`,
                ),

            closeDialog: () =>
                set(
                    { activeDialog: null, dialogData: null, isTerminateAction: false },
                    undefined,
                    'closeDialog',
                ),

            isDialogOpen: (name) => get().activeDialog === name,

            setIsTerminateAction: (val) =>
                set({ isTerminateAction: val }, undefined, 'setIsTerminateAction'),
        }),
        { name: 'DialogStore' },
    ),
);
