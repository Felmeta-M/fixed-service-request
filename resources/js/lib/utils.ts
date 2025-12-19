import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function delay(ms: number): Promise<void> {
    if (ms < 0) {
        throw new Error('Delay duration must be a non-negative number');
    }

    return new Promise((resolve) => setTimeout(resolve, ms));
}