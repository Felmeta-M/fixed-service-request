import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import { Loader2, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';

const prefixes = [
    { value: '+251', label: '+251' },
    { value: '0', label: '0' },
];

export function LoginForm() {
    const { props } = usePage();
    const initialPhone: string = typeof props.phone === 'string' ? props.phone : '';

    const [prefix, setPrefix] = useState('+251');
    const [phoneNumber, setPhoneNumber] = useState(initialPhone.replace('+251', ''));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setPhoneNumber(initialPhone.replace('+251', ''));
    }, [initialPhone]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Validate phone number
        if (!phoneNumber) {
            setError('Please enter your mobile number');
            setIsLoading(false);
            return;
        }

        // Basic validation for  phone numbers
        // const phoneRegex = /^[79]\d{8}$/;
        // if (!phoneRegex.test(phoneNumber)) {
        //     setError('Please enter a valid mobile number');
        //     setIsLoading(false);
        //     return;
        // }

        try {
            const cleanPhone = prefix === '+251' ? `251${phoneNumber}` : phoneNumber;

            await router.post('/otp/send', { phone: cleanPhone });

            // Redirect to OTP verification
            router.visit('/otp/verify');
        } catch (err) {
            if (err.response?.data?.errors?.phone?.includes('wait')) {
                setError('Please wait 1 minute before requesting another OTP');
            } else {
                setError('Failed to send OTP. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="flex space-x-2">
                    <Select value={prefix} onValueChange={setPrefix}>
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {prefixes.map((p) => (
                                <SelectItem key={p.value} value={p.value}>
                                    {p.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder={prefix === '+251' ? '912345678' : '912345678'}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="flex-1"
                    />
                </div>
                <p className="text-xs text-muted-foreground">Enter your registered mobile number to receive an OTP</p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending OTP...
                    </>
                ) : (
                    <>
                        <Phone className="mr-2 h-4 w-4" />
                        Send OTP
                    </>
                )}
            </Button>
        </form>
    );
}
