import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface MobileStepIndicatorProps {
    currentStep: number;
    steps: Array<{ name: string; icon: any }>;
    className?: string;
}

export function MobileStepIndicator({ currentStep, steps, className }: MobileStepIndicatorProps) {
    return (
        <div className={cn('w-full border-b bg-white', className)}>
            <div className="px-2 py-2">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const status = index < currentStep ? 'complete' : index === currentStep ? 'current' : 'upcoming';
                        const isCompleted = status === 'complete';
                        const isCurrent = status === 'current';
                        const Icon = step.icon;

                        return (
                            <div key={step.name} className="flex flex-1 flex-col items-center">
                                {/* Step circle with connecting line */}
                                <div className="flex w-full items-center">
                                    {/* Left connector */}
                                    {index > 0 && (
                                        <div
                                            className={cn(
                                                'h-0.5 flex-1 transition-colors duration-300',
                                                index <= currentStep ? 'bg-primary' : 'bg-gray-200',
                                            )}
                                        />
                                    )}

                                    {/* Step circle */}
                                    <div
                                        className={cn(
                                            'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200',
                                            isCompleted
                                                ? 'border-primary bg-primary text-white'
                                                : isCurrent
                                                  ? 'border-primary bg-white text-primary'
                                                  : 'border-gray-300 bg-white text-gray-400',
                                        )}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="h-5 w-5" />
                                        ) : (
                                            <Icon className={cn('h-5 w-5', isCurrent ? 'text-primary' : 'text-gray-400')} />
                                        )}
                                    </div>

                                    {/* Right connector */}
                                    {index < steps.length - 1 && (
                                        <div
                                            className={cn(
                                                'h-0.5 flex-1 transition-colors duration-300',
                                                index < currentStep ? 'bg-primary' : 'bg-gray-200',
                                            )}
                                        />
                                    )}
                                </div>

                                {/* Step label */}
                                {/* <span
                                    className={cn(
                                        'mt-2 text-center text-xs font-medium',
                                        isCompleted || isCurrent ? 'text-primary' : 'text-gray-500',
                                    )}
                                >
                                    {step.name}
                                </span> */}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
