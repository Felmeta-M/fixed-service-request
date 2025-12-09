import { FormSelectProps } from '@/types';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
export default function FormSelect({
    label,
    id,
    required,
    value,
    onChange,
    options,
    placeholder,
    error,
    disabled,
    loading,
    labelRight,
}: FormSelectProps & { required?: boolean }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="font-medium text-gray-700">
                {label}
                {required && <span className=" text-red-500">*</span>}
                {labelRight && <div className="inline-block">{labelRight}</div>}
            </Label>

            <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
                <SelectTrigger className={`${error ? 'border-red-300' : 'border-gray-300'} flex items-center justify-between`}>
                    {loading ? (
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            <span className="text-sm text-gray-500">Loading...</span>
                        </div>
                    ) : (
                        <SelectValue placeholder={placeholder} />
                    )}
                </SelectTrigger>

                {!loading && (
                    <SelectContent className="bg-white shadow-lg">
                        {options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                )}
            </Select>

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
