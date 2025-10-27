import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface ImageUploadProps {
    onImageCapture: (base64Image: string) => void;
    existingImage?: string;
}

export default function ImageUpload({ onImageCapture, existingImage }: ImageUploadProps) {
    const [capturedImage, setCapturedImage] = useState<string>(existingImage || '');
    const [showWebcam, setShowWebcam] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
            setShowWebcam(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Cannot access camera. Please check permissions.');
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);

                const base64Image = canvasRef.current.toDataURL('image/png');
                setCapturedImage(base64Image);
                onImageCapture(base64Image);
                stopCamera();
            }
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setShowWebcam(false);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                setCapturedImage(base64);
                onImageCapture(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setCapturedImage('');
        onImageCapture('');
    };

    return (
        <Card className="w-full max-w-md">
            <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Customer Photo</h3>

                {showWebcam ? (
                    <div className="space-y-4">
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg border" />
                        <div className="flex gap-2">
                            <Button onClick={captureImage} className="flex-1">
                                Capture
                            </Button>
                            <Button variant="outline" onClick={stopCamera}>
                                Cancel
                            </Button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {capturedImage ? (
                            <div className="relative">
                                <img src={capturedImage} alt="Captured" className="h-64 w-full rounded-lg border object-cover" />
                                <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removeImage}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                                <Camera className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                <p className="mb-4 text-gray-600">No photo captured</p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button onClick={startCamera} className="flex-1">
                                <Camera className="mr-2 h-4 w-4" />
                                Take Photo
                            </Button>

                            <Button variant="outline" asChild>
                                <label>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
