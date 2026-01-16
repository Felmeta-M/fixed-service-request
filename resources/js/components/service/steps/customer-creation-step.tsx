// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { useCustomerCategories, useCustomerSubcategories, useCustomerTypes } from '@/hooks/use-customer-types';
// import { useOccupations } from '@/hooks/use-occupations';
// import { useRegions, useWoredas, useZones } from '@/hooks/use-regions';
// import { cn } from '@/lib/utils';
// import { FormSelectProps } from '@/types';
// import { CustomerFormValues, createDynamicCustomerSchema } from '@/types/customer';
// import { router, useForm, usePage } from '@inertiajs/react';
// import { Building, CheckCircle, FileIcon, MapPinIcon, PhoneIcon, User } from 'lucide-react';
// import { FormEventHandler, useEffect, useMemo, useState } from 'react';
// import { toast } from 'sonner';
// import { z } from 'zod';
// import { useGetCustomer, useCreateCustomer, useUploadEcaf } from '@/hooks/use-api-mutations';

// type ApiError = {
//     message: string;
//     errors?: Record<string, string[]>;
//     status?: number;
// };

// type SubmissionState = {
//     isSubmitting: boolean;
//     isUploadingPhoto: boolean;
//     error: ApiError | null;
//     success: boolean;
// };

// type FieldError = {
//     field: string;
//     message: string;
// };

// export function FormSelect({
//     label,
//     id,
//     required,
//     value,
//     onChange,
//     options,
//     placeholder,
//     error,
//     disabled,
//     loading,
//     labelRight,
// }: FormSelectProps & { required?: boolean }) {
//     const hasError = !!error;
    
//     return (
//         <div className="space-y-2">
//             <Label htmlFor={id} className={cn("font-medium", hasError ? "text-red-700" : "text-gray-700")}>
//                 {label}
//                 {required && <span className="text-red-500">*</span>}
//                 {labelRight && <div className="inline-block">{labelRight}</div>}
//             </Label>

//             <div className="relative">
//                 <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
//                     <SelectTrigger 
//                         className={cn(
//                             "flex items-center justify-between transition-colors",
//                             hasError 
//                                 ? "border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200 bg-red-50" 
//                                 : "border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
//                         )}
//                     >
//                         {loading ? (
//                             <div className="flex items-center space-x-2">
//                                 <svg className="h-4 w-4 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
//                                 </svg>
//                                 <span className="text-sm text-gray-500">Loading...</span>
//                             </div>
//                         ) : (
//                             <SelectValue placeholder={placeholder} />
//                         )}
//                     </SelectTrigger>

//                     {!loading && (
//                         <SelectContent className="bg-white shadow-lg">
//                             {options?.map((opt) => (
//                                 <SelectItem key={opt.value} value={opt.value}>
//                                     {opt.label}
//                                 </SelectItem>
//                             ))}
//                         </SelectContent>
//                     )}
//                 </Select>
//                 {hasError && (
//                     <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
//                         <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
//                             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                         </svg>
//                     </div>
//                 )}
//             </div>

//             {error && (
//                 <div className="flex items-start gap-1">
//                     <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                     </svg>
//                     <p className="text-sm text-red-600 font-medium">{error}</p>
//                 </div>
//             )}
//         </div>
//     );
// }

// export interface FormInputProps {
//     label: string;
//     id: string;
//     value?: string | number | null;
//     onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//     autoFocus?: boolean;
//     placeholder?: string;
//     error?: string;
//     type?: React.HTMLInputTypeAttribute;
//     required?: boolean;
//     readOnly?: boolean;
//     disabled?: boolean;
// }

// export function FormInput({
//     label,
//     id,
//     value,
//     onChange,
//     autoFocus,
//     placeholder = '',
//     error,
//     type = 'text',
//     required = false,
//     readOnly = false,
//     disabled = false,
// }: FormInputProps) {
//     const safeValue = value ?? '';
//     const hasError = !!error;
    
//     return (
//         <div className="space-y-2">
//             <Label htmlFor={id} className={cn("font-medium", hasError ? "text-red-700" : "text-gray-700")}>
//                 {label}
//                 {required && <span className="text-red-500">*</span>}
//             </Label>
//             <div className="relative">
//                 <input
//                     type={type}
//                     className={cn(
//                         'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors',
//                         hasError 
//                             ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200 bg-red-50' 
//                             : 'border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20',
//                     )}
//                     id={id}
//                     value={safeValue}
//                     onChange={onChange}
//                     autoFocus={autoFocus}
//                     placeholder={placeholder}
//                     readOnly={readOnly}
//                     disabled={disabled}
//                 />
//                 {hasError && (
//                     <div className="absolute right-3 top-1/2 -translate-y-1/2">
//                         <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
//                             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                         </svg>
//                     </div>
//                 )}
//             </div>
//             {error && (
//                 <div className="flex items-start gap-1">
//                     <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                     </svg>
//                     <p className="text-sm text-red-600 font-medium">{error}</p>
//                 </div>
//             )}
//         </div>
//     );
// }

// // Utility function to handle API errors
// const handleApiError = (error: unknown): ApiError => {
//     // Handle ApiClientError from our API client
//     if (error && typeof error === 'object' && 'status' in error && 'data' in error) {
//         const apiError = error as { status?: number; data?: any; message?: string };
//         const status = apiError.status;
//         const responseData = apiError.data;

//         // Enhanced 422 error handling
//         if (status === 422) {
//             // Laravel validation errors can be in different formats
//             const errors = responseData?.errors || responseData?.data?.errors || {};
            
//             // Build a comprehensive error message for 422
//             const errorCount = Object.keys(errors).length;
//             const message = errorCount > 0 
//                 ? `Validation failed: ${errorCount} field${errorCount > 1 ? 's' : ''} need${errorCount > 1 ? '' : 's'} attention`
//                 : responseData?.message || 'Validation failed. Please check your input.';

//             return {
//                 message,
//                 errors,
//                 status: 422,
//             };
//         }

//         return {
//             message: responseData?.message || apiError.message || 'An API error occurred',
//             errors: responseData?.errors || responseData?.data?.errors,
//             status,
//         };
//     }

//     if (error instanceof Error) {
//         return {
//             message: error.message,
//         };
//     }

//     return {
//         message: 'An unexpected error occurred',
//     };
// };

// interface CustomerCreationStepProps {
//     onNext: () => void;
// }

// export function CustomerCreationStep({ onNext }: CustomerCreationStepProps) {
//     const { auth } = usePage().props;
//     const { user } = auth;

//     const { occupations, loading: occupationsLoading, error: occupationError } = useOccupations();
//     const [formErrors, setFormErrors] = useState<Record<string, string>>({});
//     const [submissionState, setSubmissionState] = useState<SubmissionState>({
//         isSubmitting: false,
//         isUploadingPhoto: false,
//         error: null,
//         success: false,
//     });
//     const [createdCustomerData, setCreatedCustomerData] = useState<any>(null);

//     const [readOnlyFields, setReadOnlyFields] = useState<Set<string>>(new Set());
//     const [isLoadingPrefill, setIsLoadingPrefill] = useState(true);
//     const [hasNidData, setHasNidData] = useState(false);

//     // TanStack Query hooks
//     const { data: customerData, isLoading: isLoadingCustomer } = useGetCustomer(user?.customer_sub_id);
//     const createCustomerMutation = useCreateCustomer();
//     const uploadEcafMutation = useUploadEcaf();

//     // Fields that should be read-only when filled from NID
//     const NID_READONLY_FIELDS = [
//         'first_name',
//         'middle_name',
//         'last_name',
//         'gender',
//         'date_of_birth',
//         'nationality',
//         'identification_type',
//         'identification_number',
//         // 'contact.notification_mode',
//         // 'contact.mobile_no',
//     ];

//     const { data, setData } = useForm<CustomerFormValues>('createCustomer', {
//         first_name: '',
//         middle_name: '',
//         last_name: '',
//         title: '1',
//         gender: undefined,
//         nationality: '1231',
//         identification_type: '2',
//         identification_number: '',
//         date_of_birth: '',
//         place_of_birth: '',
//         occupation: undefined,
//         education: undefined,
//         religion: undefined,
//         income: undefined,
//         primary_language: '2060',
//         address: {
//             region: '',
//             zone: '',
//             woreda: '',
//             city: '',
//             street_name: '',
//             kebele: '',
//             house_no: '',
//         },
//         contact: {
//             notification_mode: '1',
//             mobile_no: '',
//             office_no: '',
//             email: '',
//             home_no: '',
//             fax_no: '',
//         },
//         contact_person: [],
//         customer_type: '1',
//         customer_category: '1',
//         customer_subcategory: '1',
//         customer_level: '2',
//     });

//     // Enhanced prefill data loading with better error handling
//     useEffect(() => {
//         if (customerData && (customerData as any)?.success && (customerData as any)?.data) {
//             const customer = (customerData as any).data;

//             // Show success toast for prefill
//             toast.success('Customer data loaded successfully', {
//                 description: 'Some fields are pre-filled from existing data',
//                 duration: 3000,
//             });

//             const transform = {
//                 first_name: customer.first_name || '',
//                 middle_name: customer.middle_name || '',
//                 last_name: customer.last_name || '',
//                 title: customer.title || '1',
//                 gender: customer.gender?.toLowerCase() === 'male' ? '1' : customer.gender?.toLowerCase() === 'female' ? '2' : undefined,
//                 nationality: customer.nationality?.toLowerCase() === 'ethiopian' ? '1231' : '1000',
//                 date_of_birth: customer.date_of_birth || '',
//                 place_of_birth: customer.place_of_birth || '',
//                 identification_type: customer.identification_type || '2',
//                 identification_number: customer.identification_number || '',
//                 occupation: customer.occupation || '',
//                 education: customer.education || '',
//                 religion: customer.religion || '',
//                 income: customer.income || '',
//                 primary_language: customer.primary_language || '2060',
//                 customer_type: customer.customer_type || '1',
//                 customer_category: customer.customer_category || '1',
//                 customer_subcategory: customer.customer_subcategory || '1',
//                 contact: {
//                     notification_mode: customer.contact?.notification_mode || customer.notification_mode || '1',
//                     mobile_no: customer.contact?.mobile_no || customer.phone || '',
//                     office_no: customer.contact?.office_no || customer.office_no || '',
//                     email: customer.contact?.email || customer.email || '',
//                     home_no: customer.contact?.home_no || customer.home_no || '',
//                     fax_no: customer.contact?.fax_no || customer.fax_no || '',
//                 },
//                 address: {
//                     region: customer.address?.regionne || customer.regionn || '',
//                     zone: customer.address?.zonee || customer.zonee || '',
//                     woreda: customer.address?.woredaa || customer.woredaa || '',
//                     city: customer.address?.cityy || customer.cityy || '',
//                     street_name: customer.address?.street_name || customer.street_name || '',
//                     kebele: customer.address?.kebele || customer.kebele || '',
//                     house_no: customer.address?.house_no || customer.house_no || '',
//                 },
//                 contact_person: customer.contact_person || [],
//                 customer_level: customer.customer_level || '2',
//             };

//             setData(transform);

//             // Check if data came from NID (has identification_number and related fields)
//             const hasNid = !!(transform.identification_number && transform.first_name && transform.date_of_birth);
//             setHasNidData(hasNid);

//             // Set read-only fields if data came from NID
//             if (hasNid) {
//                 const newReadOnlyFields = new Set<string>();
//                 NID_READONLY_FIELDS.forEach((field) => {
//                     if (field === 'contact.mobile_no') {
//                         if (transform.contact?.mobile_no) newReadOnlyFields.add(field);
//                     } else if (field === 'contact.notification_mode') {
//                         if (transform.contact?.notification_mode) newReadOnlyFields.add(field);
//                     } else {
//                         // @ts-ignore - dynamic access based on field name
//                         if (transform[field]) newReadOnlyFields.add(field);
//                     }
//                 });
//                 setReadOnlyFields(newReadOnlyFields);
//             }

//             // Fill phone number from NID if available and not already set
//             if (hasNid && transform.contact?.mobile_no && !data.contact?.mobile_no) {
//                 // Phone number is already in transform.contact.mobile_no from API
//             }

//             if (customer.photo_base64) {
//                 localStorage.setItem('customer_photo_base64', customer.photo_base64);
//             }
//         } else if (!isLoadingCustomer && user?.customer_sub_id) {
//             toast.info('Starting with new customer form', {
//                 description: 'No existing customer data found',
//                 duration: 3000,
//             });
//         }
//     }, [customerData, isLoadingCustomer, user?.customer_sub_id, setData, data.contact?.mobile_no]);

//     // Handle loading state
//     useEffect(() => {
//         setIsLoadingPrefill(isLoadingCustomer);
//     }, [isLoadingCustomer]);

//     // Set default customer category when customer_type is residential
//     useEffect(() => {
//         if (data.customer_type === '1' && !data.customer_category) {
//             setData('customer_category', '1');
//         }
//     }, [data.customer_type, data.customer_category, setData]);

//     // Set default customer subcategory when customer_category is residential
//     useEffect(() => {
//         if (data.customer_category === '1' && !data.customer_subcategory) {
//             setData('customer_subcategory', '1');
//         }
//     }, [data.customer_category, data.customer_subcategory, setData]);

//     const { types, loading: typesLoading, error: typesError } = useCustomerTypes();
//     const { categories, loading: categoriesLoading, error: categoriesError } = useCustomerCategories(data.customer_type);
//     const { subcategories, loading: subcategoriesLoading, error: subcategoriesError } = useCustomerSubcategories(data.customer_category);

//     const { regions: regionOptions, loading: loadingRegions } = useRegions();
//     const { zones: zoneOptions, loading: loadingZones } = useZones(data.address?.region);
//     const { woredas: woredaOptions, loading: loadingWoredas } = useWoredas(data.address?.zone);

//     // Contact person state - only one contact person
//     const [contactPerson, setContactPerson] = useState(
//         data.contact_person && data.contact_person.length > 0
//             ? data.contact_person[0]
//             : {
//                   first_name: '',
//                   middle_name: '',
//                   last_name: '',
//                   title: undefined,
//                   mobile_no: '',
//                   office_no: '',
//                   home_no: '',
//                   fax_no: '',
//               },
//     );

//     // Update contact person
//     const updateContactPerson = (field: string, val: string) => {
//         const errorKey = `contact_person.0.${field}`;
//         setContactPerson((prev) => ({ ...prev, [field]: val }));
//         setFormErrors((prev) => {
//             const next = { ...prev };
//             delete next[errorKey];
//             delete next.contact_person;
//             return next;
//         });
//     };

//     // Sync contact person with form data
//     useEffect(() => {
//         setData('contact_person', [contactPerson]);
//     }, [contactPerson, setData]);

//     // Check if a field is read-only
//     const isFieldReadOnly = (fieldName: string): boolean => {
//         return readOnlyFields.has(fieldName);
//     };

//     // Check if email is required based on notification mode
//     const isEmailRequired = useMemo(() => {
//         return data.contact?.notification_mode === '2'; // Email mode
//     }, [data.contact?.notification_mode]);

//     // Check if kebele is required based on region (not required for Addis Ababa)
//     const isKebeleRequired = useMemo(() => {
//         if (!data.address?.region) return false;
        
//         // Find the region name from the region options
//         const selectedRegion = regionOptions.find((r) => r.value === data.address?.region);
//         const regionName = selectedRegion?.label?.toLowerCase() || '';
        
//         // Addis Ababa region names (case-insensitive check)
//         const addisAbabaNames = ['addis ababa', 'addisababa', 'addis_ababa'];
//         const isAddisAbaba = addisAbabaNames.some((name) => regionName.includes(name));
        
//         return !isAddisAbaba; // Required for all regions except Addis Ababa
//     }, [data.address?.region, regionOptions]);

//     const completeCustomerSetup = () => {
//         // Step 4: Final success state
//         setSubmissionState({
//             isSubmitting: false,
//             isUploadingPhoto: false,
//             error: null,
//             success: true,
//         });

//         // Show final success message
//         toast.success('Customer setup completed!', {
//             description: 'Proceeding to service selection...',
//             duration: 3000,
//         });

//         // Cleanup
//         sessionStorage.removeItem('pending_customer_id');
//         localStorage.removeItem('customer_photo_base64');

//         // Move to next step first, then reload auth data in background
//         // This ensures smooth transition while updating the auth state
//         onNext();
        
//         // Reload auth data to update isNewCustomer flag
//         setTimeout(() => {
//             router.reload({
//                 only: ['auth'], // Only reload auth data
//                 preserveState: true, // Preserve current component state
//                 preserveScroll: true, // Preserve scroll position
//             });
//         }, 500);
//     };

//     // Enhanced submit handler with comprehensive error handling
//     const handleSubmit: FormEventHandler = async (e) => {
//         e.preventDefault();
//         // Clear previous errors
//         setFormErrors({});
//         setSubmissionState({
//             isSubmitting: true,
//             isUploadingPhoto: false,
//             error: null,
//             success: false,
//         });

//         // Start toast for submission
//         const submissionToast = toast.loading('Validating form data...', {
//             duration: Infinity,
//         });

//         // Step 1: Create dynamic schema with conditional validations
//         const dynamicSchema = createDynamicCustomerSchema(isEmailRequired, isKebeleRequired);

//         // Step 2: Validate form data
//         const result = dynamicSchema.safeParse(data);

//         if (!result.success) {
//             const fieldErrors: Record<string, string> = {};

//             for (const issue of result.error.issues) {
//                 const key = issue.path.join('.');
//                 if (key) {
//                     if (!fieldErrors[key]) fieldErrors[key] = issue.message;
//                 } else {
//                     if (!fieldErrors._form) fieldErrors._form = issue.message;
//                 }
//             }

//             setFormErrors(fieldErrors);

//             toast.error('Form validation failed', {
//                 id: submissionToast,
//                 description: 'Please check all required fields',
//                 duration: 5000,
//             });

//             setSubmissionState((prev) => ({
//                 ...prev,
//                 isSubmitting: false,
//             }));
//             return;
//         }

//         // Update toast to show creation in progress
//         toast.loading('Creating customer...', {
//             id: submissionToast,
//         });

//         // Step 2: Create customer
//         createCustomerMutation.mutate(
//                 {
//                     ...result.data,
//                     date_of_birth: result.data.date_of_birth ? result.data.date_of_birth.replace(/-/g, '') : null,
//                 },
//                 {
//                     onSuccess: (customer) => {
//                         setCreatedCustomerData(customer);

//                         // Update toast to show success
//                         toast.success('Customer created successfully!', {
//                             id: submissionToast,
//                             description: 'Now processing photo upload...',
//                             duration: 3000,
//                         });

//                         // Step 3: Upload photo if exists
//                         const base64Photo = localStorage.getItem('customer_photo_base64');
//                         if (base64Photo) {
//                             setSubmissionState((prev) => ({
//                                 ...prev,
//                                 isUploadingPhoto: true,
//                             }));

//                             const photoToast = toast.loading('Uploading customer photo...', {
//                                 description: 'Please wait',
//                                 duration: Infinity,
//                             });

//                             const ecafData = {
//                                 cust_code: customer.customer_code || customer.customer_id,
//                                 first_name: data.first_name,
//                                 last_name: data.last_name,
//                                 other_name: data.middle_name || '',
//                                 transaction_id: customer.transaction_id || `txn_${Date.now()}`,
//                                 photo: base64Photo,
//                             };

//                             uploadEcafMutation.mutate(ecafData, {
//                                 onSuccess: () => {
//                                     toast.success('Photo uploaded successfully!', {
//                                         id: photoToast,
//                                         duration: 3000,
//                                     });
//                                     setSubmissionState((prev) => ({
//                                         ...prev,
//                                         isUploadingPhoto: false,
//                                     }));
//                                     completeCustomerSetup();
//                                 },
//                                 onError: (error: Error) => {
//                                     toast.warning('Customer created but photo upload failed', {
//                                         id: photoToast,
//                                         description: error.message,
//                                         duration: 5000,
//                                     });
//                                     setSubmissionState((prev) => ({
//                                         ...prev,
//                                         isUploadingPhoto: false,
//                                     }));
//                                     completeCustomerSetup();
//                                 },
//                             });
//                         } else {
//                             completeCustomerSetup();
//                         }
//                     },
//                     onError: (error: Error) => {
//                         const apiError = handleApiError(error);

//                         // Enhanced 422 error handling - map Laravel validation errors to form fields
//                         if (apiError.status === 422 && apiError.errors) {
//                             const fieldErrors: Record<string, string> = {};
                            
//                             // Process all error fields, handling nested field names
//                             Object.entries(apiError.errors).forEach(([field, messages]) => {
//                                 // Handle array of error messages (Laravel format)
//                                 const errorMessage = Array.isArray(messages) ? messages[0] : messages;
                                
//                                 // Map Laravel field names to form field names
//                                 // Handle nested fields like 'address.region', 'contact.mobile_no'
//                                 fieldErrors[field] = errorMessage;
//                             });
                            
//                             setFormErrors(fieldErrors);

//                             // Find and scroll to first error field
//                             const firstErrorField = Object.keys(fieldErrors)[0];
//                             if (firstErrorField) {
//                                 // Try to find the input element by ID or name
//                                 setTimeout(() => {
//                                     const fieldId = firstErrorField.replace(/\./g, '_');
//                                     const element = document.getElementById(fieldId) || 
//                                                   document.querySelector(`[name="${firstErrorField}"]`) ||
//                                                   document.querySelector(`[id*="${firstErrorField.split('.').pop()}"]`);
                                    
//                                     if (element) {
//                                         element.scrollIntoView({ 
//                                             behavior: 'smooth', 
//                                             block: 'center' 
//                                         });
//                                         // Focus the element if it's an input
//                                         if (element instanceof HTMLElement && (element.tagName === 'INPUT' || element.tagName === 'SELECT')) {
//                                             element.focus();
//                                         }
//                                     } else {
//                                         // Fallback: scroll to top
//                                         window.scrollTo({ top: 0, behavior: 'smooth' });
//                                     }
//                                 }, 100);
//                             } else {
//                                 window.scrollTo({ top: 0, behavior: 'smooth' });
//                             }

//                             // Show specific 422 validation error toast
//                             const errorCount = Object.keys(fieldErrors).length;
//                             toast.error('Validation Error', {
//                                 id: submissionToast,
//                                 description: `${errorCount} field${errorCount > 1 ? 's' : ''} ${errorCount > 1 ? 'have' : 'has'} validation errors. Please check the highlighted fields.`,
//                                 duration: 8000,
//                                 action: {
//                                     label: 'Retry',
//                                     onClick: () => handleSubmit(e),
//                                 },
//                             });
//                         } else {
//                             // Handle other API errors
//                             if (apiError.errors) {
//                                 const fieldErrors: Record<string, string> = {};
//                                 Object.entries(apiError.errors).forEach(([field, messages]) => {
//                                     fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
//                                 });
//                                 setFormErrors(fieldErrors);
//                             }

//                             // Show generic error toast
//                             toast.error('Failed to create customer', {
//                                 id: submissionToast,
//                                 description: apiError.message,
//                                 duration: 10000,
//                                 action: {
//                                     label: 'Retry',
//                                     onClick: () => handleSubmit(e),
//                                 },
//                             });

//                             // Scroll to top to show errors
//                             window.scrollTo({ top: 0, behavior: 'smooth' });
//                         }

//                         // Update submission state
//                         setSubmissionState({
//                             isSubmitting: false,
//                             isUploadingPhoto: false,
//                             error: apiError,
//                             success: false,
//                         });
//                     },
//                 });
//     };


//     // Enhanced change handlers
//     const handleInputChange = (field: string, value: string) => {
//         if (isFieldReadOnly(field)) {
//             toast.warning('Field cannot be edited', {
//                 description: 'This field is pre-filled from existing data',
//                 duration: 3000,
//             });
//             return;
//         }

//         setData(field, value);
//         setFormErrors((prev) => {
//             const newErrors = { ...prev };
//             delete newErrors[field];
//             return newErrors;
//         });
//     };

//     const handleNestedInputChange = (parent: string, field: string, value: string) => {
//         const fullFieldName = `${parent}.${field}`;
//         if (isFieldReadOnly(fullFieldName)) {
//             toast.warning('Field cannot be edited', {
//                 description: 'This field is pre-filled from existing data',
//                 duration: 3000,
//             });
//             return;
//         }

//         setData(parent, {
//             ...data[parent],
//             [field]: value,
//         });

//         const errorKey = `${parent}.${field}`;
//         setFormErrors((prev) => {
//             const newErrors = { ...prev };
//             delete newErrors[errorKey];
//             return newErrors;
//         });
//     };

//     const handleSelectChange = (field: string, value: string) => {
//         if (isFieldReadOnly(field)) {
//             toast.warning('Field cannot be edited', {
//                 description: 'This field is pre-filled from existing data',
//                 duration: 3000,
//             });
//             return;
//         }

//         setData(field, value);
//         setFormErrors((prev) => {
//             const newErrors = { ...prev };
//             delete newErrors[field];
//             return newErrors;
//         });
//     };

//     const clearFieldError = (fieldPath: string) => {
//         setFormErrors((prev) => {
//             const newErrors = { ...prev };
//             delete newErrors[fieldPath];
//             return newErrors;
//         });
//     };

//     // Error summary component with enhanced 422 error display
//     const renderErrorSummary = () => {
//         if (!submissionState.error && Object.keys(formErrors).length === 0) return null;

//         const is422Error = submissionState.error?.status === 422;
//         const errorCount = Object.keys(formErrors).length;

//         return (
//             <>
//                 {submissionState.error && (
//                     <Card className={cn(
//                         "shadow-sm border-2",
//                         is422Error ? "border-red-400 bg-red-50" : "border-red-200 bg-red-50"
//                     )}>
//                         <CardContent className="p-4">
//                             <div className="flex items-start gap-3">
//                                 <div className="flex-shrink-0 mt-0.5">
//                                     {is422Error ? (
//                                         <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
//                                             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                                         </svg>
//                                     ) : (
//                                         <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
//                                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                                         </svg>
//                                     )}
//                                 </div>
//                                 <div className="flex-1 min-w-0">
//                                     <h3 className={cn(
//                                         "font-semibold mb-2",
//                                         is422Error ? "text-red-800" : "text-red-800"
//                                     )}>
//                                         {is422Error ? 'Validation Error' : 'Submission Error'}
//                                     </h3>
//                                     {submissionState.error?.message && (
//                                         <p className="text-sm text-red-700 mb-3">
//                                             {submissionState.error.message}
//                                         </p>
//                                     )}
//                                     {is422Error && errorCount > 0 && (
//                                         <div className="mt-3">
//                                             <p className="text-xs font-medium text-red-600 mb-2">
//                                                 Please fix the following {errorCount} field{errorCount > 1 ? 's' : ''}:
//                                             </p>
//                                             <ul className="space-y-1 max-h-40 overflow-y-auto">
//                                                 {Object.entries(formErrors).slice(0, 5).map(([field, message]) => {
//                                                     // Format field name for display
//                                                     const displayField = field
//                                                         .replace(/\./g, ' → ')
//                                                         .replace(/_/g, ' ')
//                                                         .replace(/\b\w/g, l => l.toUpperCase());
//                                                     return (
//                                                         <li key={field} className="text-xs text-red-600 flex items-start gap-2">
//                                                             <span className="text-red-500 mt-1">•</span>
//                                                             <span>
//                                                                 <span className="font-medium">{displayField}:</span> {message}
//                                                             </span>
//                                                         </li>
//                                                     );
//                                                 })}
//                                                 {errorCount > 5 && (
//                                                     <li className="text-xs text-red-500 italic">
//                                                         ... and {errorCount - 5} more field{errorCount - 5 > 1 ? 's' : ''}
//                                                     </li>
//                                                 )}
//                                             </ul>
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 )}
//             </>
//         );
//     };

//     // Show loading state when loading prefill data
//     if (isLoadingPrefill) {
//         return (
//             <div className="flex min-h-[400px] items-center justify-center">
//                 <Card className="w-full max-w-md">
//                     <CardContent className="flex flex-col items-center space-y-4 p-6 text-center">
//                         <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
//                         <h2 className="text-xl font-semibold">Loading Customer Data</h2>
//                         <p className="text-gray-600">Please wait while we load your existing information...</p>
//                     </CardContent>
//                 </Card>
//             </div>
//         );
//     }

//     // Check if we have any pre-filled data
//     const hasPrefilledData = readOnlyFields.size > 0;

//     return (
//         <div className="mx-auto max-w-4xl space-y-6">
//             {/* <div className="rounded-b-lg p-4 shadow-sm">
//                 <h1 className="text-2xl font-bold text-gray-900">Create New Customer</h1>
//                 <p className="text-md mt-1 text-gray-600">Fill in the customer details</p>
//             </div> */}

//             {/* Error Summary */}
//             {renderErrorSummary()}

//             <div className="">
//                 {/* <div className="pb-4">
//                     <div className="flex items-center gap-3 text-gray-800"> */}
//                         {/* <div className="flex h-10 w-10 items-center justify-center rounded-full text-primary">
//                             <User className="h-5 w-5" />
//                         </div> */}
//                         {/* <div>
//                             <h2 className="text-xl">Personal Information</h2>
//                             <div className="text-gray-500">
//                                 {hasPrefilledData ? 'Identity details and additional information' : 'Basic personal details of the customer'}
//                             </div>
//                         </div>
//                     </div>
//                 </div> */}
//                 <div className="space-y-4">
//                     <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                         <div className="space-y-2">
//                             <FormSelect
//                                 label="Customer Type"
//                                 required
//                                 id="customer_type"
//                                 value={data.customer_type}
//                                 onChange={(val) => {
//                                     setData('customer_type', val);
//                                     if (val === '1') {
//                                         setData('customer_category', '1');
//                                         setData('customer_subcategory', '1');
//                                     }
//                                     if (val === '2') {
//                                         setData('customer_category', '');
//                                         setData('customer_subcategory', '');
//                                     }
//                                     clearFieldError('customer_type');
//                                 }}
//                                 options={[
//                                     { label: 'Residential', value: '1' },
//                                     { label: 'Enterprise', value: '2' },
//                                 ]}
//                                 placeholder="Select customer type"
//                                 error={formErrors.customer_type}
//                                 disabled={isFieldReadOnly('customer_type')}
//                             />
//                         </div>
//                         <>
//                             <FormSelect
//                                 label="Customer Category"
//                                 required
//                                 id="customer_category"
//                                 value={data?.customer_category}
//                                 onChange={(val) => {
//                                     setData('customer_category', val);
//                                     setData('customer_subcategory', val === '1' ? '1' : '');
//                                     clearFieldError('customer_category');
//                                 }}
//                                 options={categories}
//                                 placeholder="Select category"
//                                 error={formErrors.customer_category || categoriesError}
//                                 loading={categoriesLoading}
//                                 disabled={isFieldReadOnly('customer_category')}
//                             />
//                             <FormSelect
//                                 label="Customer Subcategory"
//                                 required
//                                 id="customer_subcategory"
//                                 value={data?.customer_subcategory}
//                                 onChange={(val) => {
//                                     setData('customer_subcategory', val);
//                                     clearFieldError('customer_subcategory');
//                                 }}
//                                 options={subcategories}
//                                 placeholder="Select subcategory"
//                                 error={formErrors.customer_subcategory || subcategoriesError}
//                                 loading={subcategoriesLoading}
//                                 disabled={isFieldReadOnly('customer_subcategory')}
//                             />
//                         </>
//                         <FormSelect
//                             label="Title"
//                             id="title"
//                             required
//                             value={data.title || ''}
//                             onChange={(value) => handleSelectChange('title', value)}
//                             options={[
//                                 { label: 'Mr.', value: '1' },
//                                 { label: 'Mrs.', value: '2' },
//                                 { label: 'Ms.', value: '3' },
//                                 { label: 'Engineer', value: '6' },
//                                 { label: 'Professor', value: '5' },
//                                 { label: 'Doctor', value: '4' },
//                             ]}
//                             placeholder="Select title"
//                             error={formErrors.title}
//                             disabled={isFieldReadOnly('title')}
//                         />

//                         <FormInput
//                             label="First Name"
//                             id="first_name"
//                             required
//                             value={data.first_name ?? ''}
//                             onChange={(e) => handleInputChange('first_name', e.target.value)}
//                             placeholder="Enter first name"
//                             error={formErrors.first_name}
//                             readOnly={!!isFieldReadOnly('first_name')}
//                             disabled={isFieldReadOnly('first_name')}
//                         />

//                         <FormInput
//                             label="Middle Name"
//                             id="middle_name"
//                             required
//                             value={data.middle_name}
//                             onChange={(e) => handleInputChange('middle_name', e.target.value)}
//                             placeholder=""
//                             error={formErrors.middle_name}
//                             readOnly={isFieldReadOnly('middle_name')}
//                             disabled={isFieldReadOnly('middle_name')}
//                         />
//                         <FormInput
//                             label="Last Name "
//                             id="last_name"
//                             required
//                             value={data.last_name}
//                             onChange={(e) => handleInputChange('last_name', e.target.value)}
//                             placeholder=""
//                             error={formErrors.last_name}
//                             readOnly={isFieldReadOnly('last_name')}
//                             disabled={isFieldReadOnly('last_name')}
//                         />
//                         <FormSelect
//                             label="Gender"
//                             id="gender"
//                             required
//                             value={data.gender || ''}
//                             onChange={(value) => handleSelectChange('gender', value)}
//                             options={[
//                                 { label: 'Male', value: '1' },
//                                 { label: 'Female', value: '2' },
//                             ]}
//                             placeholder="Select gender"
//                             error={formErrors.gender}
//                             disabled={isFieldReadOnly('gender')}
//                         />
//                         <FormInput
//                             label="Date of Birth"
//                             id="date_of_birth"
//                             required
//                             type="date"
//                             value={data.date_of_birth}
//                             onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
//                             placeholder=""
//                             error={formErrors.date_of_birth}
//                             readOnly={isFieldReadOnly('date_of_birth')}
//                             disabled={isFieldReadOnly('date_of_birth')}
//                         />
//                         <FormSelect
//                             label="Nationality"
//                             id="nationality"
//                             required
//                             value={data.nationality || ''}
//                             onChange={(value) => handleSelectChange('nationality', value)}
//                             options={[
//                                 { label: 'Ethiopian', value: '1231' },
//                                 { label: 'Other', value: '1000' },
//                             ]}
//                             placeholder=""
//                             error={formErrors.nationality}
//                             disabled={isFieldReadOnly('nationality')}
//                         />
//                         <FormSelect
//                             label="Primary Language"
//                             id="primary_language"
//                             required
//                             value={data.primary_language || ''}
//                             onChange={(value) => handleSelectChange('primary_language', value)}
//                             options={[
//                                 { label: 'English', value: '2002' },
//                                 { label: 'Amharic', value: '2060' },
//                                 { label: 'Oromigna', value: '2061' },
//                                 { label: 'Tigrigna', value: '2062' },
//                                 { label: 'Somali', value: '2063' },
//                             ]}
//                             placeholder=""
//                             error={formErrors.primary_language}
//                             disabled={isFieldReadOnly('primary_language')}
//                         />
//                         <FormInput
//                             label="Place of Birth"
//                             id="place_of_birth"
//                             // required
//                             autoFocus
//                             value={data.place_of_birth}
//                             onChange={(e) => handleInputChange('place_of_birth', e.target.value)}
//                             placeholder=""
//                             error={formErrors.place_of_birth}
//                             readOnly={isFieldReadOnly('place_of_birth')}
//                         />
//                     </div>
//                 </div>
//             </div>

//             <div className="space-y-6">
//                 {/* <Card>
//                     <CardHeader>
//                         <CardTitle className="flex items-center gap-3 text-gray-800">
//                             <div className="flex h-10 w-10 items-center justify-center rounded-full text-primary">
//                                 <FileIcon className="h-5 w-5" />
//                             </div>
//                             <div>
//                                 <h2 className="text-xl">Identification</h2>
//                                 <CardDescription className="text-gray-500">Identification documents and numbers</CardDescription>
//                             </div>
//                         </CardTitle>
//                     </CardHeader>
//                     <CardContent className="space-y-6 p-6">
//                         <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                             <FormSelect
//                                 label="Identification Type"
//                                 id="identification_type"
//                                 value={data.identification_type || ''}
//                                 onChange={(value) => handleSelectChange('identification_type', value)}
//                                 options={[{ label: 'National ID', value: '2' }]}
//                                 placeholder="Select ID type"
//                                 error={formErrors.identification_type}
//                                 disabled={isFieldReadOnly('identification_type') || hasNidData}
//                             />
//                             <FormInput
//                                 label="Identification Number"
//                                 id="identification_number"
//                                 required
//                                 value={data.identification_number}
//                                 onChange={(e) => handleInputChange('identification_number', e.target.value)}
//                                 placeholder="Enter ID number"
//                                 error={formErrors.identification_number}
//                                 readOnly={isFieldReadOnly('identification_number') || hasNidData}
//                                 disabled={isFieldReadOnly('identification_number') || hasNidData}
//                             />
//                         </div>
//                     </CardContent>
//                 </Card> */}
//                 <div className="">
//                     <div className="pb-4">
//                         <div className="flex items-center gap-3 text-gray-800">
//                             {/* <div className="flex h-10 w-10 items-center justify-center rounded-full text-primary">
//                                 <PhoneIcon className="h-5 w-5" />
//                             </div> */}
//                             <div>
//                                 <h2 className="text-xl">Contact Information</h2>
//                                 <div className="text-gray-500">Phone numbers and email addresses</div>
//                             </div>
//                         </div>
//                     </div>
//                     <div className="space-y-6 ">
//                         <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                             <FormSelect
//                                 label="Notification Mode"
//                                 id="contact.notification_mode"
//                                 value={data.contact?.notification_mode || ''}
//                                 onChange={(val) => {
//                                     handleNestedInputChange('contact', 'notification_mode', val);
//                                     // Clear email error when notification mode changes
//                                     setFormErrors((prev) => {
//                                         const newErrors = { ...prev };
//                                         delete newErrors['contact.email'];
//                                         return newErrors;
//                                     });
//                                 }}
//                                 options={[
//                                     { label: 'SMS', value: '1' },
//                                     { label: 'Email', value: '2' },
//                                 ]}
//                                 placeholder="Select notification mode"
//                                 error={formErrors['contact.notification_mode']}
//                                 disabled={isFieldReadOnly('contact.notification_mode')}
//                             />
//                             <FormInput
//                                 label="Phone Number"
//                                 id="contact_mobile_no"
//                                 required
//                                 value={data.contact?.mobile_no || ''}
//                                 onChange={(e) => handleNestedInputChange('contact', 'mobile_no', e.target.value)}
//                                 placeholder="Enter mobile number (e.g., 0912345678)"
//                                 error={formErrors['contact.mobile_no']}
//                                 readOnly={isFieldReadOnly('contact.mobile_no')}
//                                 disabled={isFieldReadOnly('contact.mobile_no')}
//                             />
//                             <FormInput
//                                 label="Email Address"
//                                 id="email"
//                                 required={isEmailRequired}
//                                 type="email"
//                                 value={data.contact?.email || ''}
//                                 onChange={(e) => handleNestedInputChange('contact', 'email', e.target.value)}
//                                 placeholder={isEmailRequired ? '' : ''}
//                                 error={formErrors['contact.email']}
//                                 readOnly={isFieldReadOnly('contact.email')}
//                             />
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <div className="">
//                 <div className="pb-4">
//                     <div className="flex items-center gap-3 text-gray-800">
//                         {/* <div className="flex h-10 w-10 items-center justify-center rounded-full text-primary">
//                             <MapPinIcon className="h-5 w-5" />
//                         </div> */}
//                         <div>
//                             <h2 className="text-xl">Address</h2>
//                             <div className="text-gray-500">Current residential address</div>
//                         </div>
//                     </div>
//                 </div>
//                 <div className="space-y-6 ">
//                     <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                         <FormSelect
//                             label="Region"
//                             id="address.region"
//                             required
//                             value={data.address?.region}
//                             onChange={(val) => {
//                                 setData('address', { ...data.address, region: val, zone: '', woreda: '' });
//                                 clearFieldError('address.region');
//                             }}
//                             options={regionOptions}
//                             placeholder={loadingRegions ? 'Loading regions...' : 'Select region'}
//                             error={formErrors['address.region']}
//                             disabled={isFieldReadOnly('address.region')}
//                         />
//                         <FormSelect
//                             label="Zone"
//                             id="address.zone"
//                             required
//                             value={data.address?.zone}
//                             onChange={(val) => {
//                                 setData('address', { ...data.address, zone: val, woreda: '' });
//                                 clearFieldError('address.zone');
//                             }}
//                             options={data.address?.region ? zoneOptions : []}
//                             placeholder={data.address?.region ? (loadingZones ? 'Loading zones...' : 'Select zone') : 'First select region'}
//                             error={formErrors['address.zone']}
//                             disabled={isFieldReadOnly('address.zone')}
//                         />
//                         <FormSelect
//                             label="Woreda"
//                             id="address.woreda"
//                             required
//                             value={data.address?.woreda}
//                             onChange={(val) => {
//                                 setData('address', { ...data.address, woreda: val });
//                                 clearFieldError('address.woreda');
//                             }}
//                             options={data.address?.zone ? woredaOptions : []}
//                             placeholder={data.address?.zone ? (loadingWoredas ? 'Loading woredas...' : 'Select woreda') : 'First select zone'}
//                             error={formErrors['address.woreda']}
//                             disabled={isFieldReadOnly('address.woreda')}
//                         />
//                         <FormInput
//                             label="Kebele"
//                             id="address.kebele"
//                             required={isKebeleRequired}
//                             value={data.address?.kebele}
//                             onChange={(e) => handleNestedInputChange('address', 'kebele', e.target.value)}
//                             placeholder={isKebeleRequired ? '' : ''}
//                             error={formErrors['address.kebele']}
//                             readOnly={isFieldReadOnly('address.kebele')}
//                         />
//                         <FormInput
//                             label="House Number"
//                             id="address.house_no"
//                             value={data.address?.house_no}
//                             onChange={(e) => handleNestedInputChange('address', 'house_no', e.target.value)}
//                             placeholder=""
//                             error={formErrors['address.house_no']}
//                             readOnly={isFieldReadOnly('address.house_no')}
//                         />
//                     </div>
//                 </div>
//             </div>

//             <div className="space-y-6">
//                     <div className="">
//                     <div className="pb-4">
//                         <div className="flex items-center gap-3 text-gray-800">
//                             {/* <div className="flex h-10 w-10 items-center justify-center rounded-full text-primary">
//                                 <Building className="h-5 w-5" />
//                             </div> */}
//                             <div>
//                                 <h2 className="text-xl">Professional Information</h2>
//                                 <div className="text-gray-500">Work and educational background</div>
//                             </div>
//                         </div>
//                     </div>
//                     <div className="space-y-6">
//                         <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                             <FormSelect
//                                 label="Occupation"
//                                 id="occupation"
//                                 required
//                                 value={data.occupation}
//                                 onChange={(value) => handleSelectChange('occupation', value)}
//                                 options={occupations}
//                                 placeholder={occupationsLoading ? 'Loading occupations...' : 'Select occupation'}
//                                 error={formErrors.occupation || (occupationError ? occupationError : undefined)}
//                                 disabled={occupationsLoading || isFieldReadOnly('occupation')}
//                             />
//                             <FormSelect
//                                 label="Education"
//                                 id="education"
//                                 required
//                                 value={data.education || ''}
//                                 onChange={(value) => handleSelectChange('education', value)}
//                                 options={[
//                                     { label: 'Illiterate', value: '1' },
//                                     { label: 'Primary school', value: '2' },
//                                     { label: 'Secondary school', value: '3' },
//                                     { label: 'Diploma/certificate', value: '4' },
//                                     { label: "Bachelor's degree", value: '5' },
//                                     { label: "Master's degree and above", value: '6' },
//                                     { label: 'Unknown', value: '70' },
//                                     { label: 'Master', value: '90' },
//                                     { label: 'Doctor', value: '100' },
//                                     { label: 'Others', value: '110' },
//                                     { label: 'Bachelor', value: '80' },
//                                 ]}
//                                 placeholder="Select education level"
//                                 error={formErrors.education}
//                                 disabled={isFieldReadOnly('education')}
//                             />
//                             <FormSelect
//                                 label="Religion"
//                                 id="religion"
//                                 required
//                                 value={data.religion || ''}
//                                 onChange={(value) => handleSelectChange('religion', value)}
//                                 options={[
//                                     { label: 'Christianity', value: '1' },
//                                     { label: 'Islam', value: '2' },
//                                     { label: 'Catholics', value: '4' },
//                                     { label: 'Orthodox', value: '5' },
//                                     { label: 'Protestant', value: '6' },
//                                     { label: 'Other', value: '3' },
//                                 ]}
//                                 placeholder="Select religion"
//                                 error={formErrors.religion}
//                                 disabled={isFieldReadOnly('religion')}
//                             />
//                             {/* <FormSelect
//                                 label="Income Level"
//                                 id="income"
//                                 required
//                                 value={data.income}
//                                 onChange={(value) => handleSelectChange('income', value)}
//                                 options={[
//                                     { label: 'Birr 0-999', value: '1' },
//                                     { label: 'Birr 1,000-1,999', value: '2' },
//                                     { label: 'Birr 2,000-3,499', value: '3' },
//                                     { label: 'Birr 3,500-4,999', value: '4' },
//                                     { label: 'Birr 5,000-7,999', value: '5' },
//                                     { label: 'Birr 8,000-15,000', value: '6' },
//                                     { label: 'Above Birr 15,000', value: '7' },
//                                 ]}
//                                 placeholder="Select income level"
//                                 error={formErrors.income}
//                                 disabled={isFieldReadOnly('income')}
//                             /> */}
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <div className="flex justify-end rounded-lg">
//                 <Button
//                     type="button"
//                     onClick={handleSubmit}
//                     disabled={submissionState.isSubmitting || submissionState.isUploadingPhoto}
//                     className={`flex items-center gap-2 text-white shadow-sm hover:shadow-md ${
//                         submissionState.isSubmitting || submissionState.isUploadingPhoto ? 'cursor-not-allowed opacity-50' : ''
//                     }`}
//                 >
//                     {submissionState.isSubmitting || submissionState.isUploadingPhoto ? (
//                         <>
//                             <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
//                             {submissionState.isUploadingPhoto ? 'Uploading Photo...' : 'Creating Customer...'}
//                         </>
//                     ) : (
//                         <>
//                             Next
//                             {/* <CheckCircle className="h-4 w-4" /> */}
//                         </>
//                     )}
//                 </Button>
//             </div>
//         </div>
//     );
// }





import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomerCategories, useCustomerSubcategories, useCustomerTypes } from '@/hooks/use-customer-types';
import { useOccupations } from '@/hooks/use-occupations';
import { useRegions, useWoredas, useZones } from '@/hooks/use-regions';
import { cn } from '@/lib/utils';
import { FormSelectProps } from '@/types';
import { CustomerFormValues, createDynamicCustomerSchema } from '@/types/customer';
import { router, useForm, usePage } from '@inertiajs/react';
import { Building, CheckCircle, FileIcon, MapPinIcon, PhoneIcon, User } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useGetCustomer, useCreateCustomer, useUploadEcaf } from '@/hooks/use-api-mutations';

type ApiError = {
    message: string;
    errors?: Record<string, string[]>;
    status?: number;
};

type SubmissionState = {
    isSubmitting: boolean;
    isUploadingPhoto: boolean;
    error: ApiError | null;
    success: boolean;
};

type FieldError = {
    field: string;
    message: string;
};

export function FormSelect({
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
    const hasError = !!error;
    
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className={cn("font-medium", hasError ? "text-red-700" : "text-gray-700")}>
                {label}
                {required && <span className="text-red-500">*</span>}
                {labelRight && <div className="inline-block">{labelRight}</div>}
            </Label>

            <div className="relative">
                <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
                    <SelectTrigger 
                        className={cn(
                            "flex items-center justify-between transition-colors",
                            hasError 
                                ? "border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200 bg-red-50" 
                                : "border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        )}
                    >
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
                            {options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    )}
                </Select>
                {hasError && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-start gap-1">
                    <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
            )}
        </div>
    );
}

export interface FormInputProps {
    label: string;
    id: string;
    value?: string | number | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    autoFocus?: boolean;
    placeholder?: string;
    error?: string;
    type?: React.HTMLInputTypeAttribute;
    required?: boolean;
    readOnly?: boolean;
    disabled?: boolean;
}

export function FormInput({
    label,
    id,
    value,
    onChange,
    autoFocus,
    placeholder = '',
    error,
    type = 'text',
    required = false,
    readOnly = false,
    disabled = false,
}: FormInputProps) {
    const safeValue = value ?? '';
    const hasError = !!error;
    
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className={cn("font-medium", hasError ? "text-red-700" : "text-gray-700")}>
                {label}
                {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
                <input
                    type={type}
                    className={cn(
                        'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors',
                        hasError 
                            ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200 bg-red-50' 
                            : 'border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20',
                    )}
                    id={id}
                    value={safeValue}
                    onChange={onChange}
                    autoFocus={autoFocus}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    disabled={disabled}
                />
                {hasError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>
            {error && (
                <div className="flex items-start gap-1">
                    <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
            )}
        </div>
    );
}

// Updated handleApiError to work with TanStack Query errors
const handleApiError = (error: unknown): ApiError => {
    // Handle TanStack Query errors which may have Axios-like structure
    if (error && typeof error === 'object') {
        const err = error as any;
        
        console.log('err', err);
        // Check if it has a response property (Axios-like)
        if (err.response) {
            const status = err.response?.status;
            const responseData = err.response?.data;

            console.log('responseData', responseData);
            // Enhanced 422 error handling
            if (status === 422) {
                // Laravel validation errors can be in different formats
                const errors = responseData?.errors || responseData?.data?.errors || {};
                
                // Build a comprehensive error message for 422
                const errorCount = Object.keys(errors).length;
                const message = errorCount > 0 
                    ? `Validation failed: ${errorCount} field${errorCount > 1 ? 's' : ''} need${errorCount > 1 ? '' : 's'} attention`
                    : responseData?.message || 'Validation failed. Please check your input.';

                return {
                    message,
                    errors,
                    status: 422,
                };
            }

            return {
                message: responseData?.message || err.message || 'An API error occurred',
                errors: responseData?.errors || responseData?.data?.errors,
                status,
            };
        }
        
        // Check if it has data property directly (some error structures)
        if (err.data) {
            return {
                message: err.data?.message || err.message || 'An API error occurred',
                errors: err.data?.errors || err.data?.data?.errors,
                status: err.status,
            };
        }
    }

    if (error instanceof Error) {
        return {
            message: error.message,
        };
    }
    console.log('error', error);

    return {
        message: 'An unexpected error occurred',
    };
};

interface CustomerCreationStepProps {
    onNext: () => void;
}

export function CustomerCreationStep({ onNext }: CustomerCreationStepProps) {
    const { auth } = usePage().props;
    const { user } = auth;

    const { occupations, loading: occupationsLoading, error: occupationError } = useOccupations();
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submissionState, setSubmissionState] = useState<SubmissionState>({
        isSubmitting: false,
        isUploadingPhoto: false,
        error: null,
        success: false,
    });
    const [createdCustomerData, setCreatedCustomerData] = useState<any>(null);

    const [readOnlyFields, setReadOnlyFields] = useState<Set<string>>(new Set());
    const [isLoadingPrefill, setIsLoadingPrefill] = useState(true);
    const [hasNidData, setHasNidData] = useState(false);

    // TanStack Query hooks - use user's API token
    const { data: customerData, isLoading: isLoadingCustomer, error: customerError } = useGetCustomer(user?.customer_sub_id);
    const createCustomerMutation = useCreateCustomer();
    const uploadEcafMutation = useUploadEcaf();

    // Fields that should be read-only when filled from NID - UPDATED
    const NID_READONLY_FIELDS = [
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'date_of_birth',
        'nationality',
        'identification_type',
        'identification_number',
        // 'contact.notification_mode',
        // 'contact.mobile_no',
    ];

    const { data, setData } = useForm<CustomerFormValues>('createCustomer', {
        first_name: '',
        middle_name: '',
        last_name: '',
        title: '1',
        gender: undefined,
        nationality: '1231',
        identification_type: '2',
        identification_number: '',
        date_of_birth: '',
        place_of_birth: '',
        occupation: undefined,
        education: undefined,
        religion: undefined,
        income: undefined,
        primary_language: '2060',
        address: {
            region: '',
            zone: '',
            woreda: '',
            city: '',
            street_name: '',
            kebele: '',
            house_no: '',
        },
        contact: {
            notification_mode: '1',
            mobile_no: '',
            office_no: '',
            email: '',
            home_no: '',
            fax_no: '',
        },
        contact_person: [],
        customer_type: '1',
        customer_category: '1',
        customer_subcategory: '1',
        customer_level: '2',
    });

    // Enhanced prefill data loading with better error handling - FIXED
    useEffect(() => {
        const loadPrefillData = () => {
            try {
                setIsLoadingPrefill(true);
                
                // Check if we have customer data from TanStack Query
                if (customerData) {
                    console.log('Customer data received:', customerData);
                    
                    // Check the actual structure of the response
                    const responseData = customerData as any;
                    
                    // Check for success in different possible response structures
                    const isSuccess = responseData?.success || 
                                    responseData?.data?.success || 
                                    responseData?.original?.success;
                    
                    const customer = responseData?.data || 
                                   responseData?.original?.data || 
                                   responseData;
                    
                    if (isSuccess && customer) {
                        // Show success toast for prefill
                        toast.success('Customer data loaded successfully', {
                            description: 'Some fields are pre-filled from existing data',
                            duration: 3000,
                        });

                        // Transform data to match form structure
                        const transform: any = {
                            first_name: customer.first_name || '',
                            middle_name: customer.middle_name || '',
                            last_name: customer.last_name || '',
                            title: customer.title || '1',
                            gender: customer.gender?.toLowerCase() === 'male' ? '1' : 
                                   customer.gender?.toLowerCase() === 'female' ? '2' : undefined,
                            nationality: customer.nationality?.toLowerCase() === 'ethiopian' ? '1231' : '1000',
                            date_of_birth: customer.date_of_birth || '',
                            place_of_birth: customer.place_of_birth || '',
                            identification_type: customer.identification_type || '2',
                            identification_number: customer.identification_number || '',
                            occupation: customer.occupation || '',
                            education: customer.education || '',
                            religion: customer.religion || '',
                            income: customer.income || '',
                            primary_language: customer.primary_language || '2060',
                            customer_type: customer.customer_type || '1',
                            customer_category: customer.customer_category || '1',
                            customer_subcategory: customer.customer_subcategory || '1',
                            contact: {
                                notification_mode: customer.contact?.notification_mode || customer.notification_mode || '1',
                                mobile_no: customer.contact?.mobile_no || customer.phone || customer.mobile_no || '',
                                office_no: customer.contact?.office_no || customer.office_no || '',
                                email: customer.contact?.email || customer.email || '',
                                home_no: customer.contact?.home_no || customer.home_no || '',
                                fax_no: customer.contact?.fax_no || customer.fax_no || '',
                            },
                            address: {
                                region: customer.address?.regionne || customer.regionn || customer.region || '',
                                zone: customer.address?.zonee || customer.zonee || customer.zone || '',
                                woreda: customer.address?.woredaa || customer.woredaa || customer.woreda || '',
                                city: customer.address?.cityy || customer.cityy || customer.city || '',
                                street_name: customer.address?.street_name || customer.street_name || '',
                                kebele: customer.address?.kebele || customer.kebele || '',
                                house_no: customer.address?.house_no || customer.house_no || '',
                            },
                            contact_person: customer.contact_person || [],
                            customer_level: customer.customer_level || '2',
                        };

                        // Update form data
                        Object.keys(transform).forEach(key => {
                            if (key === 'contact' || key === 'address') {
                                Object.keys(transform[key]).forEach(subKey => {
                                    setData(`${key}.${subKey}` as any, transform[key][subKey]);
                                });
                            } else {
                                setData(key as any, transform[key]);
                            }
                        });

                        // Check if data came from NID (has identification_number and related fields)
                        const hasNid = !!(transform.identification_number && transform.first_name && transform.date_of_birth);
                        console.log('Has NID data:', hasNid, transform.identification_number, transform.first_name, transform.date_of_birth);
                        setHasNidData(hasNid);

                        // Set read-only fields if data came from NID
                        if (hasNid) {
                            const newReadOnlyFields = new Set<string>();
                            NID_READONLY_FIELDS.forEach((field) => {
                                const fieldValue = getNestedValue(transform, field);
                                console.log(`Checking field ${field}:`, fieldValue);
                                if (fieldValue && fieldValue.toString().trim() !== '') {
                                    newReadOnlyFields.add(field);
                                    console.log(`Field ${field} marked as read-only with value:`, fieldValue);
                                }
                            });
                            console.log('Read-only fields:', Array.from(newReadOnlyFields));
                            setReadOnlyFields(newReadOnlyFields);
                        }

                        // Check for photo data
                        if (customer.photo_base64) {
                            localStorage.setItem('customer_photo_base64', customer.photo_base64);
                        }
                    } else {
                        console.log('No customer data found or success false:', responseData);
                        toast.info('Starting with new customer form', {
                            description: 'No existing customer data found',
                            duration: 3000,
                        });
                    }
                } else if (customerError) {
                    console.error('Error loading customer data:', customerError);
                    toast.error('Failed to load customer data', {
                        description: customerError.message || 'Please try again',
                        duration: 5000,
                    });
                } else if (!isLoadingCustomer && user?.customer_sub_id) {
                    console.log('No customer data received for ID:', user.customer_sub_id);
                    toast.info('Starting with new customer form', {
                        description: 'No existing customer data found',
                        duration: 3000,
                    });
                }
            } catch (error) {
                console.error('Error in prefill data loading:', error);
                toast.error('Error loading prefill data', {
                    description: 'Please refresh and try again',
                    duration: 5000,
                });
            } finally {
                setIsLoadingPrefill(false);
            }
        };

        loadPrefillData();
    }, [customerData, customerError, isLoadingCustomer, user?.customer_sub_id, setData]);

    // Helper function to get nested values
    const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((acc, part) => {
            if (acc && typeof acc === 'object') {
                return acc[part];
            }
            return undefined;
        }, obj);
    };

    // Initialize defaults on mount - ensure Individual is selected with Residential defaults
    useEffect(() => {
        // Ensure customer_type defaults to '1' (Individual)
        if (!data.customer_type) {
            setData('customer_type', '1');
        }
        // When customer_type is '1' (Individual), set defaults to Residential
        if (data.customer_type === '1') {
            if (!data.customer_category || data.customer_category !== '1') {
                setData('customer_category', '1');
            }
            if (!data.customer_subcategory || data.customer_subcategory !== '1') {
                setData('customer_subcategory', '1');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Set default customer category when customer_type is Individual (residential)
    useEffect(() => {
        if (data.customer_type === '1') {
            // Always set to '1' (Residential) when Individual is selected
            if (data.customer_category !== '1') {
                setData('customer_category', '1');
            }
        }
    }, [data.customer_type, setData]);

    // Set default customer subcategory when customer_category is Residential
    useEffect(() => {
        if (data.customer_category === '1') {
            // Always set to '1' (Residential) when category is Residential
            if (data.customer_subcategory !== '1') {
                setData('customer_subcategory', '1');
            }
        }
    }, [data.customer_category, setData]);

    const { types, loading: typesLoading, error: typesError } = useCustomerTypes();
    const { categories, loading: categoriesLoading, error: categoriesError } = useCustomerCategories(data.customer_type);
    const { subcategories, loading: subcategoriesLoading, error: subcategoriesError } = useCustomerSubcategories(data.customer_category);

    const { regions: regionOptions, loading: loadingRegions } = useRegions();
    const { zones: zoneOptions, loading: loadingZones } = useZones(data.address?.region);
    const { woredas: woredaOptions, loading: loadingWoredas } = useWoredas(data.address?.zone);

    // Contact person state - only one contact person
    const [contactPerson, setContactPerson] = useState(
        data.contact_person && data.contact_person.length > 0
            ? data.contact_person[0]
            : {
                  first_name: '',
                  middle_name: '',
                  last_name: '',
                  title: undefined,
                  mobile_no: '',
                  office_no: '',
                  home_no: '',
                  fax_no: '',
              },
    );

    // Update contact person
    const updateContactPerson = (field: string, val: string) => {
        const errorKey = `contact_person.0.${field}`;
        setContactPerson((prev) => ({ ...prev, [field]: val }));
        setFormErrors((prev) => {
            const next = { ...prev };
            delete next[errorKey];
            delete next.contact_person;
            return next;
        });
    };

    // Sync contact person with form data
    useEffect(() => {
        setData('contact_person', [contactPerson]);
    }, [contactPerson, setData]);

    // Check if a field is read-only - FIXED
    const isFieldReadOnly = (fieldName: string): boolean => {
        const isReadOnly = readOnlyFields.has(fieldName);
        console.log(`Field ${fieldName} read-only:`, isReadOnly, 'All read-only fields:', Array.from(readOnlyFields));
        return isReadOnly;
    };

    // Check if email is required based on notification mode
    const isEmailRequired = useMemo(() => {
        return data.contact?.notification_mode === '2'; // Email mode
    }, [data.contact?.notification_mode]);

    // Check if kebele is required based on region (not required for Addis Ababa)
    const isKebeleRequired = useMemo(() => {
        if (!data.address?.region) return false;
        
        // Find the region name from the region options
        const selectedRegion = regionOptions.find((r) => r.value === data.address?.region);
        const regionName = selectedRegion?.label?.toLowerCase() || '';
        
        // Addis Ababa region names (case-insensitive check)
        const addisAbabaNames = ['addis ababa', 'addisababa', 'addis_ababa'];
        const isAddisAbaba = addisAbabaNames.some((name) => regionName.includes(name));
        
        return !isAddisAbaba; // Required for all regions except Addis Ababa
    }, [data.address?.region, regionOptions]);

    const completeCustomerSetup = () => {
        // Step 4: Final success state
        setSubmissionState({
            isSubmitting: false,
            isUploadingPhoto: false,
            error: null,
            success: true,
        });

        // Show final success message
        toast.success('Customer setup completed!', {
            description: 'Proceeding to service selection...',
            duration: 3000,
        });

        // Cleanup
        sessionStorage.removeItem('pending_customer_id');
        localStorage.removeItem('customer_photo_base64');

        // Move to next step first, then reload auth data in background
        // This ensures smooth transition while updating the auth state
        onNext();
        
        // Reload auth data to update isNewCustomer flag
        setTimeout(() => {
            router.reload({
                only: ['auth'], // Only reload auth data
                preserveState: true, // Preserve current component state
                preserveScroll: true, // Preserve scroll position
            });
        }, 500);
    };

    // Enhanced submit handler with comprehensive error handling
    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        // Clear previous errors
        setFormErrors({});
        setSubmissionState({
            isSubmitting: true,
            isUploadingPhoto: false,
            error: null,
            success: false,
        });

        // Start toast for submission
        const submissionToast = toast.loading('Validating form data...', {
            duration: Infinity,
        });

        // Step 1: Create dynamic schema with conditional validations
        const dynamicSchema = createDynamicCustomerSchema(isEmailRequired, isKebeleRequired);

        // Step 2: Validate form data
        const result = dynamicSchema.safeParse(data);

        if (!result.success) {
            const fieldErrors: Record<string, string> = {};

            for (const issue of result.error.issues) {
                const key = issue.path.join('.');
                if (key) {
                    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
                } else {
                    if (!fieldErrors._form) fieldErrors._form = issue.message;
                }
            }

            setFormErrors(fieldErrors);

            toast.error('Form validation failed', {
                id: submissionToast,
                description: 'Please check all required fields',
                duration: 5000,
            });

            setSubmissionState((prev) => ({
                ...prev,
                isSubmitting: false,
            }));
            return;
        }

        // Update toast to show creation in progress
        toast.loading('Creating customer...', {
            id: submissionToast,
        });

        // Step 2: Create customer
        createCustomerMutation.mutate(
            {
                ...result.data,
                date_of_birth: result.data.date_of_birth ? result.data.date_of_birth.replace(/-/g, '') : null,
            },
            {
                onSuccess: (customer) => {
                    setCreatedCustomerData(customer);

                    // Update toast to show success
                    toast.success('Customer created successfully!', {
                        id: submissionToast,
                        description: 'Now processing photo upload...',
                        duration: 3000,
                    });

                    // Step 3: Upload photo if exists
                    const base64Photo = localStorage.getItem('customer_photo_base64');
                    if (base64Photo) {
                        setSubmissionState((prev) => ({
                            ...prev,
                            isUploadingPhoto: true,
                        }));

                        const photoToast = toast.loading('Uploading customer photo...', {
                            description: 'Please wait',
                            duration: Infinity,
                        });

                        const ecafData = {
                            cust_code: customer.customer_code || customer.customer_id,
                            first_name: data.first_name,
                            last_name: data.last_name,
                            other_name: data.middle_name || '',
                            transaction_id: customer.transaction_id || `txn_${Date.now()}`,
                            photo: base64Photo,
                        };

                        uploadEcafMutation.mutate(ecafData, {
                            onSuccess: () => {
                                toast.success('Photo uploaded successfully!', {
                                    id: photoToast,
                                    duration: 3000,
                                });
                                setSubmissionState((prev) => ({
                                    ...prev,
                                    isUploadingPhoto: false,
                                }));
                                completeCustomerSetup();
                            },
                            onError: (error: Error) => {
                                toast.warning('Customer created but photo upload failed', {
                                    id: photoToast,
                                    description: error.message,
                                    duration: 5000,
                                });
                                setSubmissionState((prev) => ({
                                    ...prev,
                                    isUploadingPhoto: false,
                                }));
                                completeCustomerSetup();
                            },
                        });
                    } else {
                        completeCustomerSetup();
                    }
                },
                onError: (error: Error) => {
                    const apiError = handleApiError(error);

                    // Enhanced 422 error handling - map Laravel validation errors to form fields
                    if (apiError.status === 422 && apiError.errors) {
                        const fieldErrors: Record<string, string> = {};
                        
                        // Process all error fields, handling nested field names
                        Object.entries(apiError.errors).forEach(([field, messages]) => {
                            // Handle array of error messages (Laravel format)
                            const errorMessage = Array.isArray(messages) ? messages[0] : messages;
                            
                            // Map Laravel field names to form field names
                            // Handle nested fields like 'address.region', 'contact.mobile_no'
                            fieldErrors[field] = errorMessage;
                        });
                        
                        setFormErrors(fieldErrors);

                        // Find and scroll to first error field
                        const firstErrorField = Object.keys(fieldErrors)[0];
                        if (firstErrorField) {
                            // Try to find the input element by ID or name
                            setTimeout(() => {
                                const fieldId = firstErrorField.replace(/\./g, '_');
                                const element = document.getElementById(fieldId) || 
                                              document.querySelector(`[name="${firstErrorField}"]`) ||
                                              document.querySelector(`[id*="${firstErrorField.split('.').pop()}"]`);
                                
                                if (element) {
                                    element.scrollIntoView({ 
                                        behavior: 'smooth', 
                                        block: 'center' 
                                    });
                                    // Focus the element if it's an input
                                    if (element instanceof HTMLElement && (element.tagName === 'INPUT' || element.tagName === 'SELECT')) {
                                        element.focus();
                                    }
                                } else {
                                    // Fallback: scroll to top
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }, 100);
                        } else {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }

                        // Show specific 422 validation error toast
                        const errorCount = Object.keys(fieldErrors).length;
                        toast.error('Validation Error', {
                            id: submissionToast,
                            description: `${errorCount} field${errorCount > 1 ? 's' : ''} ${errorCount > 1 ? 'have' : 'has'} validation errors. Please check the highlighted fields.`,
                            duration: 8000,
                            action: {
                                label: 'Retry',
                                onClick: () => handleSubmit(e),
                            },
                        });
                    } else {
                        // Handle other API errors
                        if (apiError.errors) {
                            const fieldErrors: Record<string, string> = {};
                            Object.entries(apiError.errors).forEach(([field, messages]) => {
                                fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
                            });
                            setFormErrors(fieldErrors);
                        }

                        // Show generic error toast
                        toast.error('Failed to create customer', {
                            id: submissionToast,
                            description: apiError.message,
                            duration: 10000,
                            action: {
                                label: 'Retry',
                                onClick: () => handleSubmit(e),
                            },
                        });

                        // Scroll to top to show errors
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }

                    // Update submission state
                    setSubmissionState({
                        isSubmitting: false,
                        isUploadingPhoto: false,
                        error: apiError,
                        success: false,
                    });
                },
            }
        );
    };

    // Enhanced change handlers - FIXED
    const handleInputChange = (field: string, value: string) => {
        console.log(`Attempting to change field ${field} to:`, value, 'Read-only?', isFieldReadOnly(field));
        
        if (isFieldReadOnly(field)) {
            toast.warning('Field cannot be edited', {
                description: 'This field is pre-filled from existing data',
                duration: 3000,
            });
            return;
        }

        setData(field, value);
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    const handleNestedInputChange = (parent: string, field: string, value: string) => {
        const fullFieldName = `${parent}.${field}`;
        console.log(`Attempting to change nested field ${fullFieldName} to:`, value, 'Read-only?', isFieldReadOnly(fullFieldName));
        
        if (isFieldReadOnly(fullFieldName)) {
            toast.warning('Field cannot be edited', {
                description: 'This field is pre-filled from existing data',
                duration: 3000,
            });
            return;
        }

        setData(parent, {
            ...data[parent],
            [field]: value,
        });

        const errorKey = `${parent}.${field}`;
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[errorKey];
            return newErrors;
        });
    };

    const handleSelectChange = (field: string, value: string) => {
        console.log(`Attempting to change select field ${field} to:`, value, 'Read-only?', isFieldReadOnly(field));
        
        if (isFieldReadOnly(field)) {
            toast.warning('Field cannot be edited', {
                description: 'This field is pre-filled from existing data',
                duration: 3000,
            });
            return;
        }

        setData(field, value);
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    const clearFieldError = (fieldPath: string) => {
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldPath];
            return newErrors;
        });
    };

    // Error summary component with enhanced 422 error display
    const renderErrorSummary = () => {
        if (!submissionState.error && Object.keys(formErrors).length === 0) return null;

        const is422Error = submissionState.error?.status === 422;
        const errorCount = Object.keys(formErrors).length;

        return (
            <>
                {submissionState.error && (
                    <Card className={cn(
                        "shadow-sm border-2",
                        is422Error ? "border-red-400 bg-red-50" : "border-red-200 bg-red-50"
                    )}>
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {is422Error ? (
                                        <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={cn(
                                        "font-semibold mb-2",
                                        is422Error ? "text-red-800" : "text-red-800"
                                    )}>
                                        {is422Error ? 'Validation Error' : 'Submission Error'}
                                    </h3>
                                    {submissionState.error?.message && (
                                        <p className="text-sm text-red-700 mb-3">
                                            {submissionState.error.message}
                                        </p>
                                    )}
                                    {is422Error && errorCount > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-medium text-red-600 mb-2">
                                                Please fix the following {errorCount} field{errorCount > 1 ? 's' : ''}:
                                            </p>
                                            <ul className="space-y-1 max-h-40 overflow-y-auto">
                                                {Object.entries(formErrors).slice(0, 5).map(([field, message]) => {
                                                    // Format field name for display
                                                    const displayField = field
                                                        .replace(/\./g, ' → ')
                                                        .replace(/_/g, ' ')
                                                        .replace(/\b\w/g, l => l.toUpperCase());
                                                    return (
                                                        <li key={field} className="text-xs text-red-600 flex items-start gap-2">
                                                            <span className="text-red-500 mt-1">•</span>
                                                            <span>
                                                                <span className="font-medium">{displayField}:</span> {message}
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                                {errorCount > 5 && (
                                                    <li className="text-xs text-red-500 italic">
                                                        ... and {errorCount - 5} more field{errorCount - 5 > 1 ? 's' : ''}
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </>
        );
    };

    // Show loading state when loading prefill data
    if (isLoadingPrefill) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center space-y-4 p-6 text-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                        <h2 className="text-xl font-semibold">Loading Customer Data</h2>
                        <p className="text-gray-600">Please wait while we load your existing information...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Check if we have any pre-filled data
    const hasPrefilledData = readOnlyFields.size > 0;
    console.log('Current read-only fields:', Array.from(readOnlyFields));
    console.log('Has prefilled data:', hasPrefilledData);
    console.log('Current form data:', data);

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Debug information (remove in production) */}
            {/* {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                    <div className="font-medium text-yellow-800 mb-1">Debug Info:</div>
                    <div>Read-only fields: {Array.from(readOnlyFields).join(', ')}</div>
                    <div>Has NID data: {hasNidData ? 'Yes' : 'No'}</div>
                    <div>Customer data loaded: {customerData ? 'Yes' : 'No'}</div>
                </div>
            )} */}

            {/* Error Summary */}
            {/* // if validation error exists show it in here for debug  */}
            {submissionState.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                    <div className="font-medium text-red-800 mb-1">Validation Error:</div>
                    <div>{submissionState.error.message}</div>
                </div>
            )}
            
            {renderErrorSummary()}

            <div className="">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <FormSelect
                                label="Customer Type"
                                required
                                id="customer_type"
                                value={data.customer_type || '1'}
                                onChange={(val) => {
                                    setData('customer_type', val);
                                    // When Individual (value '1') is selected, set defaults to Residential
                                    if (val === '1') {
                                        setData('customer_category', '1');
                                        setData('customer_subcategory', '1');
                                        clearFieldError('customer_category');
                                        clearFieldError('customer_subcategory');
                                    } else {
                                        // For other types (like Enterprise), clear the defaults
                                        setData('customer_category', '');
                                        setData('customer_subcategory', '');
                                    }
                                    clearFieldError('customer_type');
                                }}
                                options={types}
                                placeholder="Select customer type"
                                error={formErrors.customer_type}
                                disabled={isFieldReadOnly('customer_type')}
                            />
                        </div>
                        <>
                            <FormSelect
                                label="Customer Category"
                                required
                                id="customer_category"
                                value={data?.customer_category || (data.customer_type === '1' ? '1' : '')}
                                onChange={(val) => {
                                    setData('customer_category', val);
                                    // When Residential category (value '1') is selected, set subcategory to Residential
                                    if (val === '1') {
                                        setData('customer_subcategory', '1');
                                        clearFieldError('customer_subcategory');
                                    } else {
                                        setData('customer_subcategory', '');
                                    }
                                    clearFieldError('customer_category');
                                }}
                                options={categories}
                                placeholder="Select category"
                                error={formErrors.customer_category || categoriesError}
                                loading={categoriesLoading}
                                disabled={isFieldReadOnly('customer_category')}
                            />
                            <FormSelect
                                label="Customer Subcategory"
                                required
                                id="customer_subcategory"
                                value={data?.customer_subcategory || (data.customer_category === '1' ? '1' : '')}
                                onChange={(val) => {
                                    setData('customer_subcategory', val);
                                    clearFieldError('customer_subcategory');
                                }}
                                options={subcategories}
                                placeholder="Select subcategory"
                                error={formErrors.customer_subcategory || subcategoriesError}
                                loading={subcategoriesLoading}
                                disabled={isFieldReadOnly('customer_subcategory')}
                            />
                        </>
                        <FormSelect
                            label="Title"
                            id="title"
                            required
                            value={data.title || ''}
                            onChange={(value) => handleSelectChange('title', value)}
                            options={[
                                { label: 'Mr.', value: '1' },
                                { label: 'Mrs.', value: '2' },
                                { label: 'Ms.', value: '3' },
                                { label: 'Engineer', value: '6' },
                                { label: 'Professor', value: '5' },
                                { label: 'Doctor', value: '4' },
                            ]}
                            placeholder="Select title"
                            error={formErrors.title}
                            disabled={isFieldReadOnly('title')}
                        />

                        <FormInput
                            label="First Name"
                            id="first_name"
                            required
                            value={data.first_name ?? ''}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            placeholder="Enter first name"
                            error={formErrors.first_name}
                            readOnly={isFieldReadOnly('first_name')}
                            disabled={isFieldReadOnly('first_name')}
                        />

                        <FormInput
                            label="Middle Name"
                            id="middle_name"
                            required
                            value={data.middle_name}
                            onChange={(e) => handleInputChange('middle_name', e.target.value)}
                            placeholder=""
                            error={formErrors.middle_name}
                            readOnly={isFieldReadOnly('middle_name')}
                            disabled={isFieldReadOnly('middle_name')}
                        />
                        <FormInput
                            label="Last Name "
                            id="last_name"
                            required
                            value={data.last_name}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                            placeholder=""
                            error={formErrors.last_name}
                            readOnly={isFieldReadOnly('last_name')}
                            disabled={isFieldReadOnly('last_name')}
                        />
                        <FormSelect
                            label="Gender"
                            id="gender"
                            required
                            value={data.gender || ''}
                            onChange={(value) => handleSelectChange('gender', value)}
                            options={[
                                { label: 'Male', value: '1' },
                                { label: 'Female', value: '2' },
                            ]}
                            placeholder="Select gender"
                            error={formErrors.gender}
                            disabled={isFieldReadOnly('gender')}
                        />
                        <FormInput
                            label="Date of Birth"
                            id="date_of_birth"
                            required
                            type="date"
                            value={data.date_of_birth}
                            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                            placeholder=""
                            error={formErrors.date_of_birth}
                            readOnly={isFieldReadOnly('date_of_birth')}
                            disabled={isFieldReadOnly('date_of_birth')}
                        />
                        <FormSelect
                            label="Nationality"
                            id="nationality"
                            required
                            value={data.nationality || ''}
                            onChange={(value) => handleSelectChange('nationality', value)}
                            options={[
                                { label: 'Ethiopian', value: '1231' },
                                { label: 'Other', value: '1000' },
                            ]}
                            placeholder=""
                            error={formErrors.nationality}
                            disabled={isFieldReadOnly('nationality')}
                        />
                        <FormSelect
                            label="Primary Language"
                            id="primary_language"
                            required
                            value={data.primary_language || ''}
                            onChange={(value) => handleSelectChange('primary_language', value)}
                            options={[
                                { label: 'English', value: '2002' },
                                { label: 'Amharic', value: '2060' },
                                { label: 'Oromigna', value: '2061' },
                                { label: 'Tigrigna', value: '2062' },
                                { label: 'Somali', value: '2063' },
                            ]}
                            placeholder=""
                            error={formErrors.primary_language}
                            disabled={isFieldReadOnly('primary_language')}
                        />
                        <FormInput
                            label="Place of Birth"
                            id="place_of_birth"
                            // required
                            autoFocus
                            value={data.place_of_birth}
                            onChange={(e) => handleInputChange('place_of_birth', e.target.value)}
                            placeholder=""
                            error={formErrors.place_of_birth}
                            readOnly={isFieldReadOnly('place_of_birth')}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="">
                    <div className="pb-4">
                        <div className="flex items-center gap-3 text-gray-800">
                            <div>
                                <h2 className="text-xl">Contact Information</h2>
                                <div className="text-gray-500">Phone numbers and email addresses</div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6 ">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormSelect
                                label="Notification Mode"
                                id="contact.notification_mode"
                                value={data.contact?.notification_mode || ''}
                                onChange={(val) => {
                                    handleNestedInputChange('contact', 'notification_mode', val);
                                    // Clear email error when notification mode changes
                                    setFormErrors((prev) => {
                                        const newErrors = { ...prev };
                                        delete newErrors['contact.email'];
                                        return newErrors;
                                    });
                                }}
                                options={[
                                    { label: 'SMS', value: '1' },
                                    { label: 'Email', value: '2' },
                                ]}
                                placeholder="Select notification mode"
                                error={formErrors['contact.notification_mode']}
                                disabled={isFieldReadOnly('contact.notification_mode')}
                            />
                            <FormInput
                                label="Phone Number"
                                id="contact_mobile_no"
                                required
                                value={data.contact?.mobile_no || ''}
                                onChange={(e) => handleNestedInputChange('contact', 'mobile_no', e.target.value)}
                                placeholder=""
                                error={formErrors['contact.mobile_no']}
                                readOnly={isFieldReadOnly('contact.mobile_no')}
                                disabled={isFieldReadOnly('contact.mobile_no')}
                            />
                            <FormInput
                                label="Email Address"
                                id="email"
                                required={isEmailRequired}
                                type="email"
                                value={data.contact?.email || ''}
                                onChange={(e) => handleNestedInputChange('contact', 'email', e.target.value)}
                                placeholder={isEmailRequired ? '' : ''}
                                error={formErrors['contact.email']}
                                readOnly={isFieldReadOnly('contact.email')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="">
                <div className="pb-4">
                    <div className="flex items-center gap-3 text-gray-800">
                        <div>
                            <h2 className="text-xl">Address</h2>
                            <div className="text-gray-500">Current residential address</div>
                        </div>
                    </div>
                </div>
                <div className="space-y-6 ">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormSelect
                            label="Region"
                            id="address.region"
                            required
                            value={data.address?.region}
                            onChange={(val) => {
                                setData('address', { ...data.address, region: val, zone: '', woreda: '' });
                                clearFieldError('address.region');
                            }}
                            options={regionOptions}
                            placeholder={loadingRegions ? 'Loading regions...' : 'Select region'}
                            error={formErrors['address.region']}
                            disabled={isFieldReadOnly('address.region')}
                        />
                        <FormSelect
                            label="Zone"
                            id="address.zone"
                            required
                            value={data.address?.zone}
                            onChange={(val) => {
                                setData('address', { ...data.address, zone: val, woreda: '' });
                                clearFieldError('address.zone');
                            }}
                            options={data.address?.region ? zoneOptions : []}
                            placeholder={data.address?.region ? (loadingZones ? 'Loading zones...' : 'Select zone') : 'First select region'}
                            error={formErrors['address.zone']}
                            disabled={isFieldReadOnly('address.zone')}
                        />
                        <FormSelect
                            label="Woreda"
                            id="address.woreda"
                            required
                            value={data.address?.woreda}
                            onChange={(val) => {
                                setData('address', { ...data.address, woreda: val });
                                clearFieldError('address.woreda');
                            }}
                            options={data.address?.zone ? woredaOptions : []}
                            placeholder={data.address?.zone ? (loadingWoredas ? 'Loading woredas...' : 'Select woreda') : 'First select zone'}
                            error={formErrors['address.woreda']}
                            disabled={isFieldReadOnly('address.woreda')}
                        />
                        <FormInput
                            label="Kebele"
                            id="address.kebele"
                            required={isKebeleRequired}
                            value={data.address?.kebele}
                            onChange={(e) => handleNestedInputChange('address', 'kebele', e.target.value)}
                            placeholder={isKebeleRequired ? '' : ''}
                            error={formErrors['address.kebele']}
                            readOnly={isFieldReadOnly('address.kebele')}
                        />
                        <FormInput
                            label="House Number"
                            id="address.house_no"
                            value={data.address?.house_no}
                            onChange={(e) => handleNestedInputChange('address', 'house_no', e.target.value)}
                            placeholder=""
                            error={formErrors['address.house_no']}
                            readOnly={isFieldReadOnly('address.house_no')}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="">
                    <div className="pb-4">
                        <div className="flex items-center gap-3 text-gray-800">
                            <div>
                                <h2 className="text-xl">Professional Information</h2>
                                <div className="text-gray-500">Work and educational background</div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormSelect
                                label="Occupation"
                                id="occupation"
                                required
                                value={data.occupation}
                                onChange={(value) => handleSelectChange('occupation', value)}
                                options={occupations}
                                placeholder={occupationsLoading ? 'Loading occupations...' : 'Select occupation'}
                                error={formErrors.occupation || (occupationError ? occupationError : undefined)}
                                disabled={occupationsLoading || isFieldReadOnly('occupation')}
                            />
                            <FormSelect
                                label="Education"
                                id="education"
                                required
                                value={data.education || ''}
                                onChange={(value) => handleSelectChange('education', value)}
                                options={[
                                    { label: 'Illiterate', value: '1' },
                                    { label: 'Primary school', value: '2' },
                                    { label: 'Secondary school', value: '3' },
                                    { label: 'Diploma/certificate', value: '4' },
                                    { label: "Bachelor's degree", value: '5' },
                                    { label: "Master's degree and above", value: '6' },
                                    // { label: 'Unknown', value: '70' },
                                    // { label: 'Master', value: '90' },
                                    // { label: 'Doctor', value: '100' },
                                    // { label: 'Others', value: '110' },
                                    // { label: 'Bachelor', value: '80' },
                                ]}
                                placeholder="Select education level"
                                error={formErrors.education}
                                disabled={isFieldReadOnly('education')}
                            />
                            <FormSelect
                                label="Religion"
                                id="religion"
                                required
                                value={data.religion || ''}
                                onChange={(value) => handleSelectChange('religion', value)}
                                options={[
                                    { label: 'Christianity', value: '1' },
                                    { label: 'Islam', value: '2' },
                                    { label: 'Catholics', value: '4' },
                                    { label: 'Orthodox', value: '5' },
                                    { label: 'Protestant', value: '6' },
                                    { label: 'Other', value: '3' },
                                ]}
                                placeholder="Select religion"
                                error={formErrors.religion}
                                disabled={isFieldReadOnly('religion')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end rounded-lg">
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submissionState.isSubmitting || submissionState.isUploadingPhoto}
                    className={`flex items-center gap-2 text-white shadow-sm hover:shadow-md ${
                        submissionState.isSubmitting || submissionState.isUploadingPhoto ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                >
                    {submissionState.isSubmitting || submissionState.isUploadingPhoto ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                            {submissionState.isUploadingPhoto ? 'Uploading Photo...' : 'Creating Customer...'}
                        </>
                    ) : (
                        <>
                            Next
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}