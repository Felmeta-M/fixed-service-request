import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface MobileStepIndicatorProps {
    currentStep: number;
    steps: Array<{ name: string; icon: any }>;
    className?: string;
}

export function MobileStepIndicator({
    currentStep,
    steps,
    className,
}: MobileStepIndicatorProps) {
    return (
        <div className={cn('w-full border-b bg-white', className)}>
            <div className=" py-2">
                <div className="flex items-center">
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        const Icon = step.icon;

                        return (
                            <div
                                key={step.name}
                                className="relative flex flex-1 items-center justify-center"
                            >
                                {/* Connector (only ONE per step, except last) */}
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            'absolute left-1/2 top-1/2 h-0.5 w-full -translate-y-1/2',
                                            index < currentStep
                                                ? 'bg-primary'
                                                : 'bg-gray-200',
                                        )}
                                    />
                                )}

                                {/* Step circle */}
                                <div
                                    className={cn(
                                        'z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200',
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
                                        <Icon
                                            className={cn(
                                                'h-5 w-5',
                                                isCurrent
                                                    ? 'text-primary'
                                                    : 'text-gray-400',
                                            )}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
