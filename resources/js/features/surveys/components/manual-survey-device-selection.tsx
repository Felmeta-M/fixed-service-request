import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeviceOptionSelector } from './device-option-selector';
import { AvailableDevice } from '@/hooks/use-available-devices';
import { useState } from 'react';
import { ArrowLeft, ChevronRight, Loader2, RouterIcon } from 'lucide-react';
import { showErrorToast, showSuccessToast, showLoadingToast } from '@/lib/toast-helpers';
import { useUpdateSurveyDevice } from '@/hooks/use-api-mutations';
import { router } from '@inertiajs/react';

interface ManualSurveyDeviceSelectionProps {
    surveyOrderId: string;
    mainOfferId: string;
    mediaType: string; // PON or COPPER from survey result
    onBack: () => void;
    onSuccess?: () => void;
}

const SERVICE_TYPES = {
    BROADBAND: '1457567289',
    VOICE: '1207609454',
    COMBO: '180427974',
};

export function ManualSurveyDeviceSelection({
    surveyOrderId,
    mainOfferId,
    mediaType,
    onBack,
    onSuccess,
}: ManualSurveyDeviceSelectionProps) {
    const isCombo = mainOfferId === SERVICE_TYPES.COMBO;
    const isVoiceOnly = mainOfferId === SERVICE_TYPES.VOICE;

    const [withDevice, setWithDevice] = useState<boolean | undefined>(undefined);
    const [selectedDevice, setSelectedDevice] = useState<AvailableDevice | null>(null);
    const [selectedDeviceInternet, setSelectedDeviceInternet] = useState<AvailableDevice | null>(null);
    const [selectedDeviceVoice, setSelectedDeviceVoice] = useState<AvailableDevice | null>(null);

    const updateDeviceMutation = useUpdateSurveyDevice();

    // Check if device selection is valid for proceeding
    const canProceed = () => {
        // Device option must be selected
        if (withDevice === undefined) {
            return false;
        }

        // If "without device", can proceed
        if (withDevice === false) {
            return true;
        }

        // If "with device", must have selected device(s)
        if (isCombo) {
            // Combo: at least one device (internet, voice, or both)
            return !!(selectedDeviceInternet?.id || selectedDeviceVoice?.id);
        } else if (isVoiceOnly) {
            return !!selectedDeviceVoice?.id;
        } else {
            return !!selectedDevice?.id;
        }
    };

    const handleDeviceOptionChange = (value: boolean) => {
        setWithDevice(value);
        if (!value) {
            // Clear selected devices when choosing "without device"
            setSelectedDevice(null);
            setSelectedDeviceInternet(null);
            setSelectedDeviceVoice(null);
        }
    };

    const handleDeviceSelect = (device: AvailableDevice) => {
        setSelectedDevice(device);
    };

    const handleInternetDeviceSelect = (device: AvailableDevice) => {
        setSelectedDeviceInternet(device);
    };

    const handleVoiceDeviceSelect = (device: AvailableDevice) => {
        setSelectedDeviceVoice(device);
    };

    const handleContinue = async () => {
        const toastId = showLoadingToast('Saving device selection...');

        try {
            // Prepare device data
            const deviceData: {
                customer_survey_order_id: string;
                with_device: boolean;
                device_id?: string;
                device_voice_id?: string;
            } = {
                customer_survey_order_id: surveyOrderId,
                with_device: !!withDevice,
            };

            if (withDevice) {
                if (isCombo) {
                    deviceData.device_id = selectedDeviceInternet?.id;
                    deviceData.device_voice_id = selectedDeviceVoice?.id;
                } else if (isVoiceOnly) {
                    deviceData.device_id = selectedDeviceVoice?.id;
                } else {
                    deviceData.device_id = selectedDevice?.id;
                }
            }

            await updateDeviceMutation.mutateAsync(deviceData);

            showSuccessToast('Device selection saved!', {
                id: toastId,
            });

            // Reload page to show updated payment info
            router.reload();

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            showErrorToast(
                error instanceof Error ? error.message : 'Failed to save device selection',
                { id: toastId }
            );
        }
    };

    const loading = updateDeviceMutation.isPending;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RouterIcon className="h-5 w-5 text-primary" />
                        Device Information
                    </CardTitle>
                    <CardDescription>
                        Your location supports {mediaType === 'PON' ? 'Fiber' : 'Copper'} connection.
                        Choose whether you want to purchase a device or use your own.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DeviceOptionSelector
                        value={withDevice}
                        serviceType={mainOfferId}
                        mediaType={mediaType}
                        onChange={handleDeviceOptionChange}
                        selectedDevice={isVoiceOnly ? null : selectedDevice}
                        selectedDeviceInternet={selectedDeviceInternet}
                        selectedDeviceVoice={selectedDeviceVoice}
                        onDeviceSelect={isVoiceOnly ? undefined : handleDeviceSelect}
                        onInternetDeviceSelect={handleInternetDeviceSelect}
                        onVoiceDeviceSelect={handleVoiceDeviceSelect}
                        disabled={loading}
                    />
                </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack} disabled={loading} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <Button
                    onClick={handleContinue}
                    disabled={!canProceed() || loading}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
