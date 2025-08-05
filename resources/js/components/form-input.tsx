import { FormInputProps } from '@/types';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function FormInput({ label, id, value, onChange, placeholder, error, type = 'text', ...props }: FormInputProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="font-medium text-gray-700">
                {label}
            </Label>
            <Input
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                type={type}
                className={`${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'} focus:ring-2 focus:outline-none`}
                {...props}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
