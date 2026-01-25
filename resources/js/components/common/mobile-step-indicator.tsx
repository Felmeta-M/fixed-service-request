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
    const currentStepData = steps[currentStep];
    const totalSteps = steps.length;

    return (
        <div className={cn('w-full border-b bg-white shadow-sm', className)}>
            {/* Step Progress Bar */}
            <div className="px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                                Step {currentStep + 1} of {totalSteps}
                            </span>
                        </div>
                        {currentStepData && (
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1 truncate">
                                {currentStepData.name}
                            </h3>
                        )}
                    </div>
                </div>

                {/* Step Icons with Progress Line - extends to full width */}
                <div className="relative w-full h-8 -mx-3 sm:-mx-4">
                    {/* Background connecting line - spans from first to last circle center */}
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 z-0 -translate-y-1/2" />
                    
                    {/* Progress line (completed steps) - extends to current step */}
                    {currentStep > 0 && steps.length > 1 && (
                        <div
                            className="absolute top-1/2 left-4 h-0.5 bg-primary z-[1] -translate-y-1/2 transition-all duration-300"
                            style={{
                                width: `calc(${(currentStep / (steps.length - 1)) * 100}% * (100% - 2rem) / 100%)`,
                            }}
                        />
                    )}

                    {/* Step circles - evenly distributed across full width using justify-between */}
                    <div className="relative flex w-full items-center justify-between z-10 h-full px-3 sm:px-4">
                        {steps.map((step, index) => {
                            const isCompleted = index < currentStep;
                            const isCurrent = index === currentStep;
                            const Icon = step.icon;

                            return (
                                <div
                                    key={step.name}
                                    className="relative flex items-center justify-center flex-shrink-0"
                                >
                                    {/* Step circle */}
                                    <div
                                        className={cn(
                                            'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 transition-all duration-200 bg-white',
                                            isCompleted
                                                ? 'border-primary bg-primary text-white shadow-sm'
                                                : isCurrent
                                                ? 'border-primary bg-white text-primary shadow-md ring-2 ring-primary/20'
                                                : 'border-gray-300 bg-white text-gray-400',
                                        )}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        ) : (
                                            <Icon
                                                className={cn(
                                                    'h-3.5 w-3.5 sm:h-4 sm:w-4',
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
        </div>
    );
}
