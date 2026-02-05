import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface MobileStepIndicatorProps {
    currentStep: number;
    steps: Array<{ name: string; icon: any }>;
    className?: string;
}

export function MobileStepIndicator({ currentStep, steps, className }: MobileStepIndicatorProps) {
    const currentStepData = steps[currentStep];
    const totalSteps = steps.length;

    return (
        <div className={cn('w-full border-b bg-white shadow-sm', className)}>
            {/* Step Progress Bar */}
            <div className="px-3 py-2.5 sm:px-4 sm:py-3">
                {/* <div className="mb-3 flex items-center justify-between">
                    {currentStepData && (
                        <h3 className="line-clamp-1 truncate text-xs font-semibold text-gray-900 sm:text-sm">{currentStepData.name}</h3>
                    )}
                    <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-medium whitespace-nowrap text-gray-500">
                            Step {currentStep + 1} of {totalSteps}
                        </span>
                    </div>
                </div> */}

                {/* Step Icons with Progress Line - extends to full width */}
                <div className="relative mx-auto h-8 w-full sm:mx-4">
                    {/* Background connecting line - spans from first to last circle center */}
                    <div className="absolute top-1/2 right-4 left-4 z-0 h-0.5 -translate-y-1/2 bg-gray-200" />

                    {/* Progress line (completed steps) - extends to current step */}
                    {currentStep > 0 && steps.length > 1 && (
                        <div
                            className="absolute top-1/2 left-4 z-[1] h-0.5 -translate-y-1/2 bg-primary transition-all duration-300"
                            style={{
                                width: `calc(${(currentStep / (steps.length - 1)) * 100}% * (100% - 2rem) / 100%)`,
                            }}
                        />
                    )}

                    {/* Step circles - evenly distributed across full width using justify-between */}
                    <div className="relative z-10 flex h-full w-full items-center justify-between px-0 sm:px-4">
                        {steps.map((step, index) => {
                            const isCompleted = index < currentStep;
                            const isCurrent = index === currentStep;
                            const Icon = step.icon;

                            return (
                                <div key={step.name} className="relative flex flex-shrink-0 items-center justify-center">
                                    {/* Step circle */}
                                    <div
                                        className={cn(
                                            'flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white transition-all duration-200 sm:h-10 sm:w-10',
                                            isCompleted
                                                ? 'border-primary bg-primary text-white shadow-sm'
                                                : isCurrent
                                                  ? 'border-primary bg-white text-primary shadow-md ring-2 ring-primary/20'
                                                  : 'border-gray-300 bg-white text-gray-400',
                                        )}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                        ) : (
                                            <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', isCurrent ? 'text-primary' : 'text-gray-400')} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
