// import { Footer } from '@/components/layout/footer';
// import { Header } from '@/components/layout/header';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Link } from '@inertiajs/react';
// import axios from 'axios';
// import {
//     AlertCircle,
//     ArrowLeft,
//     BadgeCheck,
//     CheckCircle,
//     ChevronRight,
//     Clock,
//     FileText,
//     Info,
//     Loader2,
//     Lock,
//     LogIn,
//     Menu,
//     Smartphone,
//     UserPlus,
//     X,
// } from 'lucide-react';
// import { useState } from 'react';
// import logo from '../images/ethio_logo_full.png';

// interface OtpResponse {
//     data: {
//         transaction_id: string;
//         response_time: string;
//         ret_code: string;
//         ret_msg: string;
//         masked_mobile?: string;
//         masked_email?: string;
//     };
//     ret_code?: string;
//     ret_msg?: string;
//     masked_mobile?: string;
//     masked_email?: string;
// }

// interface KycResponse {
//     success: boolean;
//     ret_code: string;
//     message: string;
//     redirect_url?: string;
//     data: {
//         headers: {};
//         original: {
//             success: boolean;
//             message: string;
//             data: {
//                 transaction_id: string;
//                 provider: string;
//                 response_time: string;
//                 kyc_status: boolean;
//                 auth_token: string;
//                 identity: {
//                     name: {
//                         eng: string;
//                         amh: string;
//                     };
//                     dob: string;
//                     gender: {
//                         eng: string;
//                         amh: string;
//                     };
//                     phone: string;
//                     email: string;
//                     address: {
//                         eng: string;
//                         amh: string;
//                     };
//                     nationality: {
//                         eng: string;
//                         amh: string;
//                     };
//                     photo_base64: string;
//                 };
//             };
//         };
//         exception: null;
//     };
// }

// interface VerificationError {
//     message: string;
//     ret_code?: string;
//     isValidationError?: boolean;
//     showNationalIdHelp?: boolean;
//     isCustomerNotFound?: boolean;
//     redirect_url?: string;
//     customer_data?: any;
// }

// // National ID validation function
// const validateEthiopianNationalId = (id: string): boolean => {
//     if (id.length !== 16) return false;
//     if (!/^\d+$/.test(id)) return false;
//     return true;
// };

// export default function VerificationPage() {
//     const [option, setOption] = useState('existing');
//     const [nationalId, setNationalId] = useState('');
//     const [serviceNumber, setServiceNumber] = useState('');
//     const [verificationCode, setVerificationCode] = useState('');
//     const [step, setStep] = useState('option');
//     const [loading, setLoading] = useState(false);
//     const [transactionId, setTransactionId] = useState('');
//     const [timestamp, setTimestamp] = useState('');
//     const [maskedContact, setMaskedContact] = useState('');
//     const [error, setError] = useState<VerificationError | null>(null);
//     const [kycData, setKycData] = useState<any>(null);
//     const [customerNotFoundData, setCustomerNotFoundData] = useState<any>(null);
//     const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//     const handleVerifyNationalId = async () => {
//         setLoading(true);
//         setError(null);

//         try {
//             if (nationalId.length !== 16) {
//                 throw {
//                     message: 'National ID must be exactly 16 digits',
//                     isValidationError: true,
//                     showNationalIdHelp: true,
//                 };
//             }

//             if (!validateEthiopianNationalId(nationalId)) {
//                 throw {
//                     message: 'Invalid National ID format. Please check your ID number.',
//                     isValidationError: true,
//                     showNationalIdHelp: true,
//                 };
//             }

//             const response = await axios.post('/api/v1/nid/otp', {
//                 individual_id: nationalId,
//             });

//             const otpData = response.data?.data?.original?.data;

//             console.log('OTP Response:', otpData);

//             if (!otpData || otpData.ret_code !== '0') {
//                 throw {
//                     message: otpData?.ret_msg || 'Failed to send verification code',
//                     ret_code: otpData?.ret_code,
//                 };
//             }

//             setTransactionId(otpData.transaction_id);
//             setTimestamp(otpData.response_time);

//             if ((response.data as any).masked_mobile || otpData.masked_mobile) {
//                 setMaskedContact(`sent to ${(response.data as any).masked_mobile || otpData.masked_mobile}`);
//             } else if ((response.data as any).masked_email || otpData.masked_email) {
//                 setMaskedContact(`sent to ${(response.data as any).masked_email || otpData.masked_email}`);
//             } else {
//                 setMaskedContact('sent to your registered contact');
//             }

//             setStep('verify');
//         } catch (err: any) {
//             console.error('OTP Error:', err);
//             console.log('err.response?.data?.message', err.response?.data?.message);

//             if (err.response?.data?.message) {
//                 setError({
//                     message: err.response.data.message,
//                     ret_code: err.response.data.ret_code,
//                     showNationalIdHelp: err.response.data.ret_code === '9999',
//                 });
//             } else if (err.isValidationError) {
//                 setError(err);
//             } else {
//                 setError({
//                     message: 'Failed to verify National ID. Please try again.',
//                 });
//             }

//             setStep('error');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleVerificationCode = async () => {
//         setLoading(true);
//         setError(null);

//         try {
//             if (verificationCode.length !== 6) {
//                 throw {
//                     message: 'Verification code must be exactly 6 digits',
//                     isValidationError: true,
//                 };
//             }

//             const response = await axios.post('/api/v1/nid/kyc', {
//                 individual_id: nationalId,
//                 otp_value: verificationCode,
//                 transaction_id: transactionId,
//                 timestamp: timestamp,
//             });

//             const kyc = response.data as KycResponse;
//             console.log('KYC Response:', kyc);

//             // Handle customer not found case (ret_code 404)
//             // if (kyc.ret_code === '404') {
//             //     setCustomerNotFoundData(kyc.data);
//             //     setStep('customer-not-found');
//             //     return;
//             // }
//             // Handle customer not found case (ret_code 404) - this is NOT an error!
//             if (kyc.ret_code === '404') {
//                 console.log('Customer not found - proceeding to create customer flow', kyc.data);
//                 setCustomerNotFoundData(kyc.data);
//                 setStep('customer-not-found');
//                 return;
//             }

//             // Check if the main response is successful
//             if (!kyc.success || kyc.ret_code !== '0') {
//                 throw {
//                     message: kyc.message || 'Verification failed',
//                     ret_code: kyc.ret_code,
//                 };
//             }

//             const kycResponseData = kyc.data;

//             setKycData(kycResponseData);
//             setStep('success');

//             setTimeout(() => {
//                 localStorage.setItem('kycData', JSON.stringify(kyc.data));
//                 window.location.href = '/profile';
//             }, 2000);
//         } catch (err: any) {
//             console.error('KYC Error:', err);

//             // Check if this is actually a customer not found case that was caught as an error
//             if (err.response?.data?.ret_code === '404') {
//                 console.log('Customer not found (from error catch)', err.response.data);
//                 setCustomerNotFoundData(err.response.data);
//                 setStep('customer-not-found');
//                 return;
//             }

//             if (err.response?.data?.message) {
//                 setError({
//                     message: err.response.data.message,
//                     ret_code: err.response.data.ret_code,
//                 });
//             } else if (err.isValidationError) {
//                 setError(err);
//             } else {
//                 setError({
//                     message: err.message || 'Failed to verify code. Please try again.',
//                 });
//             }

//             setStep('error');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // const handleCreateCustomer = () => {
//     //     // Redirect to customer creation page
//     //     window.location.href = '/customer/create';
//     // };

//     const handleCreateCustomer = () => {
//         // Use the redirect URL from the backend or fallback to default
//         const redirectUrl = customerNotFoundData?.redirect_url || '/create-customer';
//         console.log('Redirecting to:', redirectUrl);
//         window.location.href = redirectUrl;
//     };

//     const resetVerification = () => {
//         setNationalId('');
//         setServiceNumber('');
//         setVerificationCode('');
//         setStep('option');
//         setError(null);
//         setCustomerNotFoundData(null);
//     };

//     const formatDob = (dobString: string) => {
//         const year = dobString.substring(0, 4);
//         const month = dobString.substring(4, 6);
//         const day = dobString.substring(6, 8);
//         return `${year}-${month}-${day}`;
//     };

//     // Customer Not Found Step
//     if (step === 'customer-not-found') {
//         const identity = customerNotFoundData?.identity || customerNotFoundData?.data?.identity || {};
//         const serviceNumber = customerNotFoundData?.service_number || customerNotFoundData?.data?.service_number || '';

//         //     return (
//         //         <GuestLayout>
//         //             <div className="flex items-center justify-center p-1">
//         //                 <Card className="w-full max-w-md overflow-hidden border-0 shadow-xl">
//         //                     <div className="bg-yellow-100 p-1">
//         //                         <div className="rounded-t-lg bg-white p-6">
//         //                             <div className="mb-4 flex items-center justify-center">
//         //                                 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
//         //                                     <UserPlus className="h-8 w-8 text-yellow-600" />
//         //                                 </div>
//         //                             </div>
//         //                             <CardTitle className="text-center text-2xl font-bold text-gray-800">Profile Not Found</CardTitle>
//         //                             <CardDescription className="mt-2 text-center">We couldn't find your customer profile</CardDescription>
//         //                         </div>
//         //                     </div>

//         //                     <CardContent className="space-y-6 p-6">
//         //                         <div className="rounded-lg bg-yellow-50 p-4">
//         //                             <div className="flex items-center justify-center">
//         //                                 <div className="text-center">
//         //                                     <p className="font-medium text-yellow-800">Hello, {identity?.name?.eng || 'User'}!</p>
//         //                                     <p className="mt-1 text-sm text-yellow-600">
//         //                                         Your National ID is verified but we need to create your customer profile.
//         //                                     </p>
//         //                                 </div>
//         //                             </div>
//         //                         </div>

//         //                         <div className="space-y-4 rounded-lg bg-blue-50 p-4">
//         //                             <h4 className="font-medium text-blue-800">Your Information</h4>
//         //                             <div className="space-y-2 text-sm">
//         //                                 <div className="flex justify-between">
//         //                                     <span className="font-medium">Name:</span>
//         //                                     <span>{identity.name?.eng || 'N/A'}</span>
//         //                                 </div>
//         //                                 <div className="flex justify-between">
//         //                                     <span className="font-medium">Phone:</span>
//         //                                     <span>{identity.phone || 'N/A'}</span>
//         //                                 </div>
//         //                                 <div className="flex justify-between">
//         //                                     <span className="font-medium">Service Number:</span>
//         //                                     <span>{serviceNumber || 'N/A'}</span>
//         //                                 </div>
//         //                                 <div className="flex justify-between">
//         //                                     <span className="font-medium">Date of Birth:</span>
//         //                                     <span>{identity.dob ? formatDob(identity.dob) : 'N/A'}</span>
//         //                                 </div>
//         //                                 <div className="flex justify-between">
//         //                                     <span className="font-medium">Gender:</span>
//         //                                     <span>{identity.gender?.eng || 'N/A'}</span>
//         //                                 </div>
//         //                             </div>
//         //                         </div>

//         //                         <div className="rounded-lg bg-gray-50 p-4">
//         //                             <p className="text-center text-sm text-gray-600">
//         //                                 Click the button below to create your customer profile and continue.
//         //                             </p>
//         //                         </div>
//         //                     </CardContent>

//         //                     <CardFooter className="flex flex-col gap-3 border-t bg-gray-50 p-6">
//         //                         <Button onClick={handleCreateCustomer} className="w-full bg-primary py-3 text-lg hover:opacity-90">
//         //                             <UserPlus className="mr-2 h-5 w-5" />
//         //                             Create Customer Profile
//         //                         </Button>
//         //                         <Button variant="outline" onClick={resetVerification} className="w-full py-3 text-lg">
//         //                             Try Different Method
//         //                         </Button>
//         //                     </CardFooter>
//         //                 </Card>
//         //             </div>
//         //         </GuestLayout>
//         //     );
//         // }

//         // // Customer Not Found Step
//         // // if (step === 'customer-not-found') {
//         // //     const identity = customerNotFoundData?.identity || {};
//         // //     return (
//         // //         <GuestLayout>
//         // //             <div className="flex items-center justify-center p-1">
//         // //                 <Card className="w-full max-w-md overflow-hidden border-0 shadow-xl">
//         // //                     <div className="bg-yellow-100 p-1">
//         // //                         <div className="rounded-t-lg bg-white p-6">
//         // //                             <div className="mb-4 flex items-center justify-center">
//         // //                                 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
//         // //                                     <UserPlus className="h-8 w-8 text-yellow-600" />
//         // //                                 </div>
//         // //                             </div>
//         // //                             <CardTitle className="text-center text-2xl font-bold text-gray-800">Profile Not Found</CardTitle>
//         // //                             <CardDescription className="mt-2 text-center">We couldn't find your customer profile</CardDescription>
//         // //                         </div>
//         // //                     </div>

//         // //                     <CardContent className="space-y-6 p-6">
//         // //                         <div className="rounded-lg bg-yellow-50 p-4">
//         // //                             <div className="flex items-center justify-center">
//         // //                                 <div className="text-center">
//         // //                                     <p className="font-medium text-yellow-800">Hello, {identity?.name?.eng || 'User'}!</p>
//         // //                                     <p className="mt-1 text-sm text-yellow-600">
//         // //                                         Your National ID is verified but we need to create your customer profile.
//         // //                                     </p>
//         // //                                 </div>
//         // //                             </div>
//         // //                         </div>

//         // //                         <div className="space-y-4 rounded-lg bg-blue-50 p-4">
//         // //                             <h4 className="font-medium text-blue-800">Your Information</h4>
//         // //                             <div className="space-y-2 text-sm">
//         // //                                 <div className="flex justify-between">
//         // //                                     <span className="font-medium">Name:</span>
//         // //                                     <span>{identity.name?.eng || 'N/A'}</span>
//         // //                                 </div>
//         // //                                 <div className="flex justify-between">
//         // //                                     <span className="font-medium">Phone:</span>
//         // //                                     <span>{identity.phone || 'N/A'}</span>
//         // //                                 </div>
//         // //                                 <div className="flex justify-between">
//         // //                                     <span className="font-medium">Date of Birth:</span>
//         // //                                     <span>{identity.dob ? formatDob(identity.dob) : 'N/A'}</span>
//         // //                                 </div>
//         // //                                 <div className="flex justify-between">
//         // //                                     <span className="font-medium">Gender:</span>
//         // //                                     <span>{identity.gender?.eng || 'N/A'}</span>
//         // //                                 </div>
//         // //                             </div>
//         // //                         </div>

//         // //                         <div className="rounded-lg bg-gray-50 p-4">
//         // //                             <p className="text-center text-sm text-gray-600">
//         // //                                 Click the button below to create your customer profile and continue.
//         // //                             </p>
//         // //                         </div>
//         // //                     </CardContent>

//         // //                     <CardFooter className="flex flex-col gap-3 border-t bg-gray-50 p-6">
//         // //                         <Button onClick={handleCreateCustomer} className="w-full bg-primary py-3 text-lg hover:opacity-90">
//         // //                             <UserPlus className="mr-2 h-5 w-5" />
//         // //                             Create Customer Profile
//         // //                         </Button>
//         // //                         <Button variant="outline" onClick={resetVerification} className="w-full py-3 text-lg">
//         // //                             Try Different Method
//         // //                         </Button>
//         // //                     </CardFooter>
//         // //                 </Card>
//         // //             </div>
//         // //         </GuestLayout>
//         // //     );
//         // // }

//         // if (step === 'success') {
//         //     return (
//         //         <GuestLayout>
//         //             <div className="flex items-center justify-center p-1">
//         //                 <Card className="w-full max-w-md overflow-hidden border-0 shadow-xl">
//         //                     <div className="bg-green-100 p-1">
//         //                         <div className="rounded-t-lg bg-white p-6">
//         //                             <div className="mb-4 flex items-center justify-center">
//         //                                 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
//         //                                     <CheckCircle className="h-8 w-8 text-green-600" />
//         //                                 </div>
//         //                             </div>
//         //                             <CardTitle className="text-center text-2xl font-bold text-gray-800">Verification Successful!</CardTitle>
//         //                             <CardDescription className="mt-2 text-center">
//         //                                 {kycData ? 'Your identity has been successfully verified.' : 'Your phone number has been successfully verified.'}
//         //                             </CardDescription>
//         //                         </div>
//         //                     </div>

//         //                     <CardContent className="space-y-6 p-6">
//         //                         <div className="rounded-lg bg-green-50 p-4">
//         //                             <div className="flex items-center justify-center">
//         //                                 <div className="text-center">
//         //                                     <p className="font-medium text-green-800">
//         //                                         {kycData ? `Welcome, ${kycData.identity?.name?.eng || 'User'}!` : 'Welcome back!'}
//         //                                     </p>
//         //                                     <p className="mt-1 text-sm text-green-600">Redirecting to your profile...</p>
//         //                                 </div>
//         //                             </div>
//         //                         </div>

//         //                         {kycData && (
//         //                             <div className="space-y-3 text-sm">
//         //                                 <div className="flex justify-between">
//         //                                     <span className="font-medium">Name:</span>
//         //                                     <span>{kycData.identity.name.eng}</span>
//         //                                 </div>
//         //                                 <div className="flex justify-between">
//         //                                     <span className="font-medium">Date of Birth:</span>
//         //                                     <span>{formatDob(kycData.identity.dob)}</span>
//         //                                 </div>
//         //                                 <div className="flex justify-between">
//         //                                     <span className="font-medium">Gender:</span>
//         //                                     <span>{kycData.identity.gender.eng}</span>
//         //                                 </div>
//         //                             </div>
//         //                         )}
//         //                     </CardContent>

//         //                     <CardFooter className="flex justify-center border-t bg-gray-50 p-6">
//         //                         <p className="text-center text-sm text-gray-600">Your information is securely encrypted and protected.</p>
//         //                     </CardFooter>
//         //                 </Card>
//         //             </div>
//         //         </GuestLayout>
//         //     );
//         // }

//         // if (step === 'error') {
//         //     return (
//         //         <GuestLayout>
//         //             <div className="flex items-center justify-center p-1">
//         //                 <Card className="w-full max-w-md overflow-hidden border-0 shadow-xl">
//         //                     <div className="bg-red-100 p-1">
//         //                         <div className="rounded-t-lg bg-white p-6">
//         //                             <div className="mb-4 flex items-center justify-center">
//         //                                 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
//         //                                     <AlertCircle className="h-8 w-8 text-red-600" />
//         //                                 </div>
//         //                             </div>
//         //                             <CardTitle className="text-center text-2xl font-bold text-gray-800">Verification Failed</CardTitle>
//         //                             <CardDescription className="mt-2 text-center">
//         //                                 {error?.message || 'An error occurred during verification'}
//         //                             </CardDescription>
//         //                         </div>
//         //                     </div>

//         //                     <CardContent className="space-y-6 p-6">
//         //                         <div className="rounded-lg bg-red-50 p-4">
//         //                             <div className="flex items-center justify-center">
//         //                                 <div className="text-center">
//         //                                     <p className="font-medium text-red-800">
//         //                                         {error?.ret_code ? `Error Code: ${error.ret_code}` : 'Please try again'}
//         //                                     </p>
//         //                                     <p className="mt-1 text-sm text-red-600">
//         //                                         {error?.isValidationError
//         //                                             ? 'Please check your input and try again.'
//         //                                             : 'There was a problem with the verification process.'}
//         //                                     </p>
//         //                                 </div>
//         //                             </div>
//         //                         </div>

//         //                         {error?.showNationalIdHelp && (
//         //                             <div className="rounded-lg bg-blue-50 p-4">
//         //                                 <div className="flex items-start gap-3">
//         //                                     <Info className="mt-0.5 h-5 w-5 text-blue-500" />
//         //                                     <div>
//         //                                         <h4 className="font-medium text-blue-800">National ID Help</h4>
//         //                                         <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-700">
//         //                                             <li>Make sure you're entering your 16-digit Ethiopian National ID</li>
//         //                                             <li>Check that all digits are correct and in the right order</li>
//         //                                             <li>Ensure you're not including any spaces or special characters</li>
//         //                                             <li>If you continue to have issues, please contact support</li>
//         //                                         </ul>
//         //                                     </div>
//         //                                 </div>
//         //                             </div>
//         //                         )}
//         //                     </CardContent>

//         //                     <CardFooter className="flex justify-center border-t bg-gray-50 p-6">
//         //                         <Button onClick={resetVerification} className="w-full bg-primary py-3 text-lg hover:opacity-90">
//         //                             Try Again
//         //                         </Button>
//         //                     </CardFooter>
//         //                 </Card>
//         //             </div>
//         //         </GuestLayout>
//         //     );
//         // }

//         // return (
//         //     <AuthLayout>
//         //         <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-2">
//         //             <Card className="w-full max-w-md overflow-hidden border-0 shadow-xl">
//         //                 <div className="bg-primary p-1">
//         //                     <div className="rounded-t-lg bg-white p-6">
//         //                         <div className="mb-4 flex items-center justify-center">
//         //                             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
//         //                                 <Shield className="h-6 w-6 text-primary" />
//         //                             </div>
//         //                         </div>
//         //                         <CardTitle className="text-center text-2xl font-bold text-gray-800">Identity Verification</CardTitle>
//         //                         <CardDescription className="mt-2 text-center">
//         //                             {step === 'option'
//         //                                 ? 'Select how you would like to verify your identity'
//         //                                 : step === 'nationalId'
//         //                                   ? 'Enter your National ID for verification'
//         //                                   : step === 'verify'
//         //                                     ? 'Enter the verification code'
//         //                                     : ''}
//         //                         </CardDescription>
//         //                     </div>
//         //                 </div>

//         //                 <CardContent className="space-y-6 p-6">
//         //                     {step !== 'option' && (
//         //                         <Button
//         //                             variant="ghost"
//         //                             onClick={() => {
//         //                                 if (step === 'verify') {
//         //                                     setStep('nationalId');
//         //                                 } else {
//         //                                     setStep('option');
//         //                                 }
//         //                             }}
//         //                             className="flex items-center p-0 text-primary hover:bg-transparent hover:text-green-600"
//         //                         >
//         //                             <ArrowLeft className="mr-1 h-4 w-4" />
//         //                             Back
//         //                         </Button>
//         //                     )}
//         //                     {step === 'option' && (
//         //                         <>
//         //                             <div className="space-y-4">
//         //                                 <button
//         //                                     onClick={() => setStep('nationalId')}
//         //                                     className="flex w-full items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition hover:bg-blue-50 focus:outline-none"
//         //                                 >
//         //                                     <div className="flex items-center space-x-4">
//         //                                         {/* National ID Icon */}
//         //                                         <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
//         //                                             <img src={logo} alt="National ID" className="h-12 w-12 object-contain" />
//         //                                         </div>
//         //                                         <div className="text-left">
//         //                                             <p className="text-base font-semibold text-gray-800">Continue with National ID</p>
//         //                                             <p className="text-sm text-gray-500">Use your 16-digit National ID</p>
//         //                                         </div>
//         //                                     </div>
//         //                                     <ChevronRight className="h-5 w-5 text-gray-400" />
//         //                                 </button>

//         //                                 <Link
//         //                                     href={route('otp.phone')}
//         //                                     className="flex w-full items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition hover:bg-blue-50 focus:outline-none"
//         //                                 >
//         //                                     <div className="flex items-center space-x-4">
//         //                                         <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
//         //                                             <Phone className="h-6 w-6 text-primary" />
//         //                                         </div>
//         //                                         <div className="text-left">
//         //                                             <p className="text-base font-semibold text-gray-800">Continue with Phone Number</p>
//         //                                             <p className="text-sm text-gray-500">Use your existing ethio telecom phone number</p>
//         //                                         </div>
//         //                                     </div>
//         //                                     <ChevronRight className="h-5 w-5 text-gray-400" />
//         //                                 </Link>
//         //                             </div>
//         //                         </>
//         //                     )}

//         //                     {step === 'nationalId' && (
//         //                         <>
//         //                             <div className="space-y-4">
//         //                                 <div>
//         //                                     <Label htmlFor="nationalId" className="mb-2 block text-base font-medium">
//         //                                         National ID Number
//         //                                     </Label>
//         //                                     <Input
//         //                                         id="nationalId"
//         //                                         type="text"
//         //                                         placeholder="xxxx xxxx xxxx xxxx"
//         //                                         value={nationalId}
//         //                                         onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
//         //                                         className="py-3 text-lg"
//         //                                         maxLength={16}
//         //                                     />
//         //                                     <p className="mt-2 text-sm text-gray-500">Enter your 16-digit National ID number.</p>
//         //                                 </div>
//         //                             </div>
//         //                             <Button
//         //                                 onClick={handleVerifyNationalId}
//         //                                 disabled={loading || nationalId.length !== 16}
//         //                                 className="w-full bg-primary py-3 text-lg hover:opacity-90 disabled:opacity-70"
//         //                             >
//         //                                 {loading ? (
//         //                                     <>
//         //                                         <Loader2 className="mr-2 h-5 w-5 animate-spin" />
//         //                                         Verifying ID...
//         //                                     </>
//         //                                 ) : (
//         //                                     'Verify National ID'
//         //                                 )}
//         //                             </Button>
//         //                         </>
//         //                     )}
//         //                     {step === 'verify' && (
//         //                         <div className="space-y-6">
//         //                             <div className="text-center">
//         //                                 <p className="text-sm text-muted-foreground">
//         //                                     Verification code sent to <span className="font-medium">{maskedContact}</span>
//         //                                 </p>
//         //                             </div>

//         //                             <form
//         //                                 onSubmit={(e) => {
//         //                                     e.preventDefault();
//         //                                     handleVerificationCode();
//         //                                 }}
//         //                                 className="space-y-4"
//         //                             >
//         //                                 <div className="space-y-2">
//         //                                     <Label>Enter 6-digit Code</Label>
//         //                                     <div className="flex justify-center space-x-2">
//         //                                         {Array.from({ length: 6 }).map((_, index) => (
//         //                                             <Input
//         //                                                 key={index}
//         //                                                 id={`otp-${index}`}
//         //                                                 type="text"
//         //                                                 inputMode="numeric"
//         //                                                 maxLength={1}
//         //                                                 value={verificationCode[index] || ''}
//         //                                                 onChange={(e) => {
//         //                                                     const val = e.target.value.replace(/\D/g, '');
//         //                                                     if (!val) return;
//         //                                                     const newCode = verificationCode.split('');
//         //                                                     newCode[index] = val;
//         //                                                     setVerificationCode(newCode.join(''));

//         //                                                     // auto-focus next input
//         //                                                     if (val && index < 5) {
//         //                                                         const nextInput = document.getElementById(`otp-${index + 1}`);
//         //                                                         nextInput?.focus();
//         //                                                     }
//         //                                                 }}
//         //                                                 onKeyDown={(e) => {
//         //                                                     if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
//         //                                                         const prevInput = document.getElementById(`otp-${index - 1}`);
//         //                                                         prevInput?.focus();
//         //                                                     }
//         //                                                 }}
//         //                                                 onPaste={(e) => {
//         //                                                     if (index !== 0) return;
//         //                                                     e.preventDefault();
//         //                                                     const pasted = e.clipboardData.getData('text/plain').trim();
//         //                                                     if (pasted.length === 6 && /^\d+$/.test(pasted)) {
//         //                                                         setVerificationCode(pasted);
//         //                                                         const lastInput = document.getElementById(`otp-5`);
//         //                                                         lastInput?.focus();
//         //                                                     }
//         //                                                 }}
//         //                                                 className="h-12 w-12 border-primary text-center text-lg font-semibold hover:text-primary focus:border-primary focus:ring-2 focus:ring-primary"
//         //                                                 autoFocus={index === 0}
//         //                                             />
//         //                                         ))}
//         //                                     </div>
//         //                                 </div>

//         //                                 <Button
//         //                                     type="submit"
//         //                                     disabled={loading || verificationCode.length !== 6}
//         //                                     className="w-full bg-primary py-3 text-lg hover:opacity-90 disabled:opacity-70"
//         //                                 >
//         //                                     {loading ? (
//         //                                         <>
//         //                                             <Loader2 className="mr-2 h-5 w-5 animate-spin" />
//         //                                             Verifying Code...
//         //                                         </>
//         //                                     ) : (
//         //                                         'Verify Code'
//         //                                     )}
//         //                                 </Button>
//         //                             </form>
//         //                         </div>
//         //                     )}
//         //                 </CardContent>

//         //                 <CardFooter className="flex justify-center border-t bg-gray-50 p-6"></CardFooter>
//         //             </Card>
//         //         </div>
//         //     </AuthLayout>

//         return (
//             <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-emerald-100">
//                 <Header />
//                 <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
//                     <div className="w-full max-w-lg">
//                         <Card className="overflow-hidden border-0 shadow-2xl">
//                             <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-1">
//                                 <div className="rounded-t-xl bg-white p-8">
//                                     <div className="mb-6 flex items-center justify-center">
//                                         <div className="relative">
//                                             <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100">
//                                                 <UserPlus className="h-10 w-10 text-amber-600" />
//                                             </div>
//                                             <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600">
//                                                 <Info className="h-4 w-4 text-white" />
//                                             </div>
//                                         </div>
//                                     </div>
//                                     <CardTitle className="text-center text-3xl font-bold text-gray-900">Profile Not Found</CardTitle>
//                                     <CardDescription className="mt-3 text-center text-lg">Let's create your customer profile</CardDescription>
//                                 </div>
//                             </div>

//                             <CardContent className="space-y-6 p-8">
//                                 <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6">
//                                     <div className="text-center">
//                                         <p className="text-lg font-semibold text-amber-800">Hello, {identity?.name?.eng || 'User'}! 👋</p>
//                                         <p className="mt-2 text-amber-700">
//                                             Your National ID is verified but we need to create your customer profile to continue.
//                                         </p>
//                                     </div>
//                                 </div>

//                                 <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-emerald-50 p-6">
//                                     <h4 className="mb-4 flex items-center text-lg font-semibold text-cyan-900">
//                                         <FileText className="mr-2 h-5 w-5" />
//                                         Your Information
//                                     </h4>
//                                     <div className="space-y-3 text-sm">
//                                         <div className="flex items-center justify-between border-b border-cyan-100 py-2">
//                                             <span className="font-medium text-cyan-800">Full Name:</span>
//                                             <span className="font-semibold text-cyan-900">{identity.name?.eng || 'N/A'}</span>
//                                         </div>
//                                         <div className="flex items-center justify-between border-b border-cyan-100 py-2">
//                                             <span className="font-medium text-cyan-800">Phone Number:</span>
//                                             <span className="font-semibold text-cyan-900">{identity.phone || 'N/A'}</span>
//                                         </div>
//                                         <div className="flex items-center justify-between border-b border-cyan-100 py-2">
//                                             <span className="text-cyan-cyan800 font-medium">Service Number:</span>
//                                             <span className="font-semibold text-cyan-900">{serviceNumber || 'N/A'}</span>
//                                         </div>
//                                         <div className="flex items-center justify-between border-b border-cyan-100 py-2">
//                                             <span className="font-medium text-cyan-800">Date of Birth:</span>
//                                             <span className="font-semibold text-cyan-900">{identity.dob ? formatDob(identity.dob) : 'N/A'}</span>
//                                         </div>
//                                         <div className="flex items-center justify-between py-2">
//                                             <span className="font-medium text-cyan-800">Gender:</span>
//                                             <span className="font-semibold text-cyan-900">{identity.gender?.eng || 'N/A'}</span>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 <div className="rounded-2xl border bg-gray-50 p-4 text-center">
//                                     <p className="text-sm text-gray-600">
//                                         This will only take a moment. Your information is pre-filled for your convenience.
//                                     </p>
//                                 </div>
//                             </CardContent>

//                             <CardFooter className="flex flex-col gap-4 border-t bg-gray-50 p-8">
//                                 <Button
//                                     onClick={handleCreateCustomer}
//                                     className="w-full bg-gradient-to-r from-green-600 to-green-700 py-4 text-lg font-semibold shadow-lg transition-all duration-200 hover:from-green-700 hover:to-green-800"
//                                 >
//                                     <UserPlus className="mr-3 h-5 w-5" />
//                                     Create Customer Profile
//                                 </Button>
//                                 <Button
//                                     variant="outline"
//                                     onClick={resetVerification}
//                                     className="w-full border-2 py-4 text-lg transition-colors hover:bg-gray-100"
//                                 >
//                                     Try Different Method
//                                 </Button>
//                             </CardFooter>
//                         </Card>
//                     </div>
//                 </div>
//                 <Footer />
//             </div>
//         );
//     }

//     if (step === 'success') {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100">
//                 <Header />
//                 <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
//                     <div className="w-full max-w-lg">
//                         <Card className="overflow-hidden border-0 shadow-2xl">
//                             <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-1">
//                                 <div className="rounded-t-xl bg-white p-8">
//                                     <div className="mb-6 flex items-center justify-center">
//                                         <div className="relative">
//                                             <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100">
//                                                 <BadgeCheck className="h-10 w-10 text-green-600" />
//                                             </div>
//                                             <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg">
//                                                 <CheckCircle className="h-4 w-4 text-green-500" />
//                                             </div>
//                                         </div>
//                                     </div>
//                                     <CardTitle className="text-center text-3xl font-bold text-gray-900">Verification Successful!</CardTitle>
//                                     <CardDescription className="mt-3 text-center text-lg">
//                                         {kycData
//                                             ? 'Your identity has been successfully verified.'
//                                             : 'Your phone number has been successfully verified.'}
//                                     </CardDescription>
//                                 </div>
//                             </div>

//                             <CardContent className="space-y-6 p-8">
//                                 <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
//                                     <div className="text-center">
//                                         <p className="text-lg font-semibold text-green-800">
//                                             {kycData ? `Welcome, ${kycData.identity?.name?.eng || 'User'}! 🎉` : 'Welcome back!'}
//                                         </p>
//                                         <p className="mt-2 flex items-center justify-center text-green-700">
//                                             <Clock className="mr-2 h-4 w-4" />
//                                             Redirecting to your profile...
//                                         </p>
//                                     </div>
//                                 </div>

//                                 {kycData && (
//                                     <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6">
//                                         <h4 className="mb-4 flex items-center text-lg font-semibold text-cyan-900">
//                                             <FileText className="mr-2 h-5 w-5" />
//                                             Verified Information
//                                         </h4>
//                                         <div className="space-y-3 text-sm">
//                                             <div className="flex items-center justify-between border-b border-cyan-100 py-2">
//                                                 <span className="font-medium text-cyan-800">Full Name:</span>
//                                                 <span className="font-semibold text-cyan-900">{kycData.identity.name.eng}</span>
//                                             </div>
//                                             <div className="flex items-center justify-between border-b border-cyan-100 py-2">
//                                                 <span className="font-medium text-cyan-800">Date of Birth:</span>
//                                                 <span className="font-semibold text-cyan-900">{formatDob(kycData.identity.dob)}</span>
//                                             </div>
//                                             <div className="flex items-center justify-between py-2">
//                                                 <span className="font-medium text-cyan-800">Gender:</span>
//                                                 <span className="font-semibold text-cyan-900">{kycData.identity.gender.eng}</span>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 )}
//                             </CardContent>

//                             <CardFooter className="flex justify-center border-t bg-gray-50 p-8">
//                                 <div className="flex items-center text-sm text-gray-600">
//                                     <Lock className="mr-2 h-4 w-4" />
//                                     Your information is securely encrypted and protected
//                                 </div>
//                             </CardFooter>
//                         </Card>
//                     </div>
//                 </div>
//                 <Footer />
//             </div>
//         );
//     }

//     if (step === 'error') {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-100">
//                 <Header />
//                 <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
//                     <div className="w-full max-w-lg">
//                         <Card className="overflow-hidden border-0 shadow-2xl">
//                             <div className="bg-gradient-to-r from-red-500 to-rose-500 p-1">
//                                 <div className="rounded-t-xl bg-white p-8">
//                                     <div className="mb-6 flex items-center justify-center">
//                                         <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-rose-100">
//                                             <AlertCircle className="h-10 w-10 text-red-600" />
//                                         </div>
//                                     </div>
//                                     <CardTitle className="text-center text-3xl font-bold text-gray-900">Verification Failed</CardTitle>
//                                     <CardDescription className="mt-3 text-center text-lg">
//                                         {error?.message || 'An error occurred during verification'}
//                                     </CardDescription>
//                                 </div>
//                             </div>

//                             <CardContent className="space-y-6 p-8">
//                                 <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-6">
//                                     <div className="text-center">
//                                         <p className="text-lg font-semibold text-red-800">
//                                             {error?.ret_code ? `Error Code: ${error.ret_code}` : 'Please try again'}
//                                         </p>
//                                         <p className="mt-2 text-red-700">
//                                             {error?.isValidationError
//                                                 ? 'Please check your input and try again.'
//                                                 : 'There was a problem with the verification process.'}
//                                         </p>
//                                     </div>
//                                 </div>

//                                 {error?.showNationalIdHelp && (
//                                     <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-emerald-50 p-6">
//                                         <div className="flex items-start gap-4">
//                                             <Info className="mt-1 h-6 w-6 flex-shrink-0 text-cyan-500" />
//                                             <div>
//                                                 <h4 className="mb-3 text-lg font-semibold text-cyan-800">National ID Help</h4>
//                                                 <ul className="space-y-2 text-sm text-cyan-700">
//                                                     <li className="flex items-center">
//                                                         <div className="mr-2 h-1.5 w-1.5 rounded-full bg-cyan-500"></div>
//                                                         Make sure you're entering your 16-digit Ethiopian National ID
//                                                     </li>
//                                                     <li className="flex items-center">
//                                                         <div className="mr-2 h-1.5 w-1.5 rounded-full bg-cyan-500"></div>
//                                                         Check that all digits are correct and in the right order
//                                                     </li>
//                                                     <li className="flex items-center">
//                                                         <div className="mr-2 h-1.5 w-1.5 rounded-full bg-cyan-500"></div>
//                                                         Ensure you're not including any spaces or special characters
//                                                     </li>
//                                                     <li className="flex items-center">
//                                                         <div className="mr-2 h-1.5 w-1.5 rounded-full bg-cyan-500"></div>
//                                                         If you continue to have issues, please contact support
//                                                     </li>
//                                                 </ul>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 )}
//                             </CardContent>

//                             <CardFooter className="flex justify-center border-t bg-gray-50 p-8">
//                                 <Button
//                                     onClick={resetVerification}
//                                     className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 py-4 text-lg font-semibold shadow-lg transition-all duration-200 hover:from-cyan-700 hover:to-cyan-800"
//                                 >
//                                     Try Again
//                                 </Button>
//                             </CardFooter>
//                         </Card>
//                     </div>
//                 </div>
//                 <Footer />
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-white">
//             {/* <Header /> */}
//             <header className="sticky top-0 z-50 w-full border-b bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
//                 <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-2">
//                     <div className="flex h-16 items-center justify-between">
//                         {/* Logo Section */}
//                         <div className="flex items-center space-x-3">
//                             <div className="flex items-center space-x-3">
//                                 <Link href="/">
//                                     <img src={logo} alt="EthioTelecom Logo" className="h-12 w-full transition-all duration-200 hover:scale-105" />
//                                 </Link>
//                                 {/* <div className="hidden sm:block">
//                                 <h1 className="text-lg font-semibold text-gray-900">EthioTelecom</h1>
//                                 <p className="text-xs text-gray-500">Connecting Ethiopia</p>
//                             </div> */}
//                             </div>
//                         </div>

//                         {/* Desktop Navigation */}
//                         {/* {localStorage.getItem('auth') ? (
//                         <Button
//                             variant="outline"
//                             onClick={() => {
//                                 localStorage.removeItem('auth');
//                                 router.visit('/');
//                             }}
//                         >
//                             Logout
//                         </Button>
//                     ) : (
//                         <Link href="/verification" className="text-gray-600 transition-colors hover:text-primary">
//                             Login
//                         </Link>
//                     )} */}
//                         <div className="hidden items-center space-x-6 md:flex">
//                             {/* {activeCustomer ? (
//                             <div className="flex items-center space-x-4"> */}
//                             {/* Welcome Message */}
//                             {/* <div className="text-right">
//                                     <p className="text-sm font-medium text-gray-900">
//                                         Welcome back, {activeCustomer.customer?.first_name} {activeCustomer.customer?.last_name}
//                                     </p> */}
//                             {/* <p className="text-xs text-gray-500">{activeCustomer.subscribers?.length || 0} active services</p> */}
//                             {/* </div> */}

//                             {/* User Menu */}
//                             {/* <div className="flex items-center space-x-2">
//                                     <Link href="/dashboard">
//                                         <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-gray-100">
//                                             <User className="h-4 w-4" />
//                                             <span>Dashboard</span>
//                                         </Button>
//                                     </Link> */}

//                             {/* <Link href="/profile">
//                                         <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-gray-100">
//                                             <Settings className="h-4 w-4" />
//                                             <span>Profile</span>
//                                         </Button>
//                                     </Link> */}

//                             {/* <Button
//                                         variant="outline"
//                                         size="sm"
//                                         // onClick={handleLogout}
//                                         className="flex items-center space-x-2"
//                                     >
//                                         <Link href={route('logout')} method="post" className="flex items-center">
//                                             <LogOut className="mr-2 h-4 w-4" />
//                                             Sign Out
//                                         </Link>
//                                     </Button>
//                                 </div>
//                             </div>
//                         ) : ( */}
//                             <div className="flex items-center space-x-4">
//                                 {/* Navigation Links for Unauthenticated Users */}
//                                 <nav className="flex items-center space-x-6">
//                                     <Link href="#services" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
//                                         Services
//                                     </Link>
//                                     {/* <Link href="/pricing" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
//                                         Pricing
//                                     </Link>
//                                     <Link href="/support" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
//                                         Support
//                                     </Link> */}

//                                     {/* <select className="rounded-md border px-2 py-1 text-sm">
//                                         <option value="en">English</option>
//                                         <option value="am">አማርኛ</option>
//                                         <option value="or">Afaan Oromoo</option>
//                                         <option value="ti">ትግርኛ</option>
//                                         <option value="so">Af Somali</option>
//                                     </select> */}
//                                 </nav>

//                                 {/* Login Button */}
//                                 <Link href="/verification">
//                                     <Button className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:opacity-90">
//                                         <LogIn className="h-4 w-4" />
//                                         <span>Login</span>
//                                     </Button>
//                                 </Link>
//                             </div>
//                             {/* )} */}
//                         </div>

//                         {/* Mobile Menu Button */}
//                         <div className="flex md:hidden">
//                             <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
//                                 {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//                             </Button>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Mobile Menu */}
//                 {isMobileMenuOpen && (
//                     <div className="border-t bg-white/95 backdrop-blur md:hidden">
//                         <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
//                             {/* {activeCustomer ? ( */}
//                             <>
//                                 {/* Welcome Section */}
//                                 {/* <div className="border-b pb-3">
//                                         <p className="text-sm font-medium text-gray-900">
//                                             Welcome, {activeCustomer.customer?.first_name} {activeCustomer.customer?.last_name}
//                                         </p>
//                                         <p className="mt-1 text-xs text-gray-500">
//                                             {activeCustomer.contacts?.length || 0} contacts • {activeCustomer.subscribers?.length || 0} services
//                                         </p>
//                                     </div> */}

//                                 {/* Mobile Navigation Links */}
//                                 {/* <Link
//                                         href="/dashboard"
//                                         className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
//                                         onClick={() => setIsMobileMenuOpen(false)}
//                                     >
//                                         Dashboard
//                                     </Link>
//                                     <Link
//                                         href="/profile"
//                                         className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
//                                         onClick={() => setIsMobileMenuOpen(false)}
//                                     >
//                                         Profile & Settings
//                                     </Link>
//                                     <button
//                                         onClick={() => {
//                                             handleLogout();
//                                             setIsMobileMenuOpen(false);
//                                         }}
//                                         className="block w-full py-2 text-left text-sm font-medium text-red-600 hover:text-red-700"
//                                     >
//                                         Logout
//                                     </button> */}
//                             </>
//                             {/* ) : ( */}
//                             <>
//                                 {/* Unauthenticated Mobile Links */}
//                                 <Link
//                                     href="#services"
//                                     className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
//                                     onClick={() => setIsMobileMenuOpen(false)}
//                                 >
//                                     Services
//                                 </Link>
//                                 {/* <Link
//                                     href="/pricing"
//                                     className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
//                                     onClick={() => setIsMobileMenuOpen(false)}
//                                 >
//                                     Pricing
//                                 </Link>
//                                 <Link
//                                     href="/support"
//                                     className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
//                                     onClick={() => setIsMobileMenuOpen(false)}
//                                 >
//                                     Support
//                                 </Link> */}

//                                 {/* Mobile Login Button */}
//                                 <Link href="/verification" className="block pt-3" onClick={() => setIsMobileMenuOpen(false)}>
//                                     <Button className="flex w-full items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:opacity-90">
//                                         <LogIn className="h-4 w-4" />
//                                         <span>Login to Account</span>
//                                     </Button>
//                                 </Link>
//                             </>
//                             {/* )} */}
//                         </div>
//                     </div>
//                 )}
//             </header>
//             <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
//                 <div className="w-full max-w-lg">
//                     <Card className="overflow-hidden border-0 shadow-2xl">
//                         <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 p-1">
//                             <div className="rounded-t-xl bg-white p-4">
//                                 <div className="mb-2 flex items-center justify-center">
//                                     <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100">
//                                         <LogIn className="h-10 w-10 text-cyan-600" />
//                                     </div>
//                                 </div>
//                                 <CardTitle className="text-center text-3xl font-bold text-gray-900">Sign In</CardTitle>
//                                 <CardDescription className="mt-3 text-center text-lg">
//                                     {step === 'option' ? '' : step === 'nationalId' ? 'Enter your National ID' : 'Enter verification code'}
//                                 </CardDescription>
//                             </div>
//                         </div>

//                         <CardContent className="space-y-6 p-8">
//                             {step !== 'option' && (
//                                 <Button
//                                     variant="ghost"
//                                     onClick={() => {
//                                         if (step === 'verify') {
//                                             setStep('nationalId');
//                                         } else {
//                                             setStep('option');
//                                         }
//                                     }}
//                                     className="group flex items-center p-0 text-emerald-600 hover:bg-transparent hover:text-cyan-700"
//                                 >
//                                     <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
//                                     Back
//                                 </Button>
//                             )}

//                             {step === 'option' && (
//                                 <div className="space-y-4">
//                                     <div className="mb-6 text-center">
//                                         <p className="mt-1 text-gray-600">Choose how you'd like to verify your identity</p>
//                                     </div>

//                                     <button
//                                         onClick={() => setStep('nationalId')}
//                                         className="group flex w-full items-center justify-between rounded-2xl border-2 border-cyan-200 bg-white p-6 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-cyan-300 hover:shadow-xl"
//                                     >
//                                         <div className="flex items-center space-x-4">
//                                             <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-100 transition-colors group-hover:from-cyan-200 group-hover:to-cyan-200">
//                                                 <FileText className="h-7 w-7 text-cyan-600" />
//                                             </div>
//                                             <div className="text-left">
//                                                 <p className="text-lg font-semibold text-gray-800">National ID</p>
//                                                 <p className="text-sm text-gray-500">Use your 16-digit National ID</p>
//                                             </div>
//                                         </div>
//                                         <ChevronRight className="h-6 w-6 text-gray-400 transition-transform group-hover:translate-x-1" />
//                                     </button>

//                                     <Link
//                                         href={route('otp.phone')}
//                                         className="group flex w-full items-center justify-between rounded-2xl border-2 border-cyan-200 bg-white p-6 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-cyan-300 hover:shadow-xl"
//                                     >
//                                         <div className="flex items-center space-x-4">
//                                             <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-emerald-100 transition-colors group-hover:from-cyan-200 group-hover:to-emerald-200">
//                                                 <Smartphone className="h-7 w-7 text-cyan-600" />
//                                             </div>
//                                             <div className="text-left">
//                                                 <p className="text-lg font-semibold text-gray-800">Phone Number</p>
//                                                 <p className="text-sm text-gray-500">Use your Ethio Telecom number</p>
//                                             </div>
//                                         </div>
//                                         <ChevronRight className="h-6 w-6 text-gray-400 transition-transform group-hover:translate-x-1" />
//                                     </Link>
//                                 </div>
//                             )}

//                             {step === 'nationalId' && (
//                                 <div className="space-y-6">
//                                     <div className="text-center">
//                                         <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
//                                             <FileText className="h-6 w-6 text-cyan-600" />
//                                         </div>
//                                         <h3 className="text-xl font-semibold text-gray-800">Enter National ID</h3>
//                                         <p className="mt-1 text-gray-600">Please enter your 16-digit National ID number</p>
//                                     </div>

//                                     <div className="space-y-4">
//                                         <div>
//                                             <Label htmlFor="nationalId" className="mb-3 block text-base font-semibold">
//                                                 National ID Number
//                                             </Label>
//                                             <Input
//                                                 id="nationalId"
//                                                 type="text"
//                                                 placeholder="Enter 16-digit National ID"
//                                                 value={nationalId}
//                                                 onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
//                                                 className="border-2 py-4 text-lg focus:border-cyan-500 focus:ring-2 focus:ring-emerald-200"
//                                                 maxLength={16}
//                                             />
//                                             <p className="mt-2 flex items-center text-sm text-gray-500">
//                                                 <Info className="mr-1 h-4 w-4" />
//                                                 Enter your 16-digit Ethiopian National ID number
//                                             </p>
//                                         </div>
//                                     </div>
//                                     <Button
//                                         onClick={handleVerifyNationalId}
//                                         disabled={loading || nationalId.length !== 16}
//                                         className="w-full bg-gradient-to-r from-emerald-600 to-cyan-700 py-4 text-lg font-semibold shadow-lg transition-all duration-200 hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-70"
//                                     >
//                                         {loading ? (
//                                             <>
//                                                 <Loader2 className="mr-3 h-5 w-5 animate-spin" />
//                                                 Verifying ID...
//                                             </>
//                                         ) : (
//                                             'Verify National ID'
//                                         )}
//                                     </Button>
//                                 </div>
//                             )}

//                             {step === 'verify' && (
//                                 <div className="space-y-6">
//                                     <div className="text-center">
//                                         <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
//                                             <Smartphone className="h-6 w-6 text-emerald-600" />
//                                         </div>
//                                         <h3 className="text-xl font-semibold text-gray-800">Enter Verification Code</h3>
//                                         <p className="mt-1 text-gray-600">
//                                             Code <span className="font-semibold text-cyan-600">{maskedContact}</span>
//                                         </p>
//                                     </div>

//                                     <form
//                                         onSubmit={(e) => {
//                                             e.preventDefault();
//                                             handleVerificationCode();
//                                         }}
//                                         className="space-y-6"
//                                     >
//                                         <div className="space-y-4">
//                                             <Label className="text-base font-semibold">Enter 6-digit Code</Label>
//                                             <div className="flex justify-center space-x-3">
//                                                 {Array.from({ length: 6 }).map((_, index) => (
//                                                     <Input
//                                                         key={index}
//                                                         id={`otp-${index}`}
//                                                         type="text"
//                                                         inputMode="numeric"
//                                                         maxLength={1}
//                                                         value={verificationCode[index] || ''}
//                                                         onChange={(e) => {
//                                                             const val = e.target.value.replace(/\D/g, '');
//                                                             if (!val) return;
//                                                             const newCode = verificationCode.split('');
//                                                             newCode[index] = val;
//                                                             setVerificationCode(newCode.join(''));

//                                                             if (val && index < 5) {
//                                                                 const nextInput = document.getElementById(`otp-${index + 1}`);
//                                                                 nextInput?.focus();
//                                                             }
//                                                         }}
//                                                         onKeyDown={(e) => {
//                                                             if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
//                                                                 const prevInput = document.getElementById(`otp-${index - 1}`);
//                                                                 prevInput?.focus();
//                                                             }
//                                                         }}
//                                                         onPaste={(e) => {
//                                                             if (index !== 0) return;
//                                                             e.preventDefault();
//                                                             const pasted = e.clipboardData.getData('text/plain').trim();
//                                                             if (pasted.length === 6 && /^\d+$/.test(pasted)) {
//                                                                 setVerificationCode(pasted);
//                                                                 const lastInput = document.getElementById(`otp-5`);
//                                                                 lastInput?.focus();
//                                                             }
//                                                         }}
//                                                         className="h-14 w-14 border-2 border-cyan-200 text-center text-xl font-bold transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
//                                                         autoFocus={index === 0}
//                                                     />
//                                                 ))}
//                                             </div>
//                                         </div>

//                                         <Button
//                                             type="submit"
//                                             disabled={loading || verificationCode.length !== 6}
//                                             className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 py-4 text-lg font-semibold shadow-lg transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-70"
//                                         >
//                                             {loading ? (
//                                                 <>
//                                                     <Loader2 className="mr-3 h-5 w-5 animate-spin" />
//                                                     Verifying Code...
//                                                 </>
//                                             ) : (
//                                                 'Verify Code'
//                                             )}
//                                         </Button>
//                                     </form>
//                                 </div>
//                             )}
//                         </CardContent>
//                         {/*
//                         <CardFooter className="flex justify-center border-t bg-gray-50 p-8">
//                             <div className="flex items-center text-sm text-gray-600">
//                                 <Lock className="mr-2 h-4 w-4" />
//                                 Your data is protected with us
//                             </div>
//                         </CardFooter> */}
//                     </Card>
//                 </div>
//             </div>
//             {/* <Footer /> */}
//         </div>
//     );
// }

import { VerificationForm } from '@/components/verification-form';
import { GalleryVerticalEnd } from 'lucide-react';

export default function VerificationPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <a href="/" className="flex items-center gap-2 self-center font-medium">
                    <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <GalleryVerticalEnd className="size-4" />
                    </div>
                    Ethio Telecom
                </a>
                <VerificationForm />
            </div>
        </div>
    );
}
