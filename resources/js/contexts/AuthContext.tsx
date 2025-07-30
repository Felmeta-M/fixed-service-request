// import type { User } from '@/types';
// import React, { createContext, useContext, useEffect, useState } from 'react';

// interface AuthContextType {
//     user: User | null;
//     login: (phone: string, otp: string) => Promise<boolean>;
//     logout: () => void;
//     sendOTP: (phone: string) => Promise<boolean>;
//     isLoading: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (context === undefined) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };

// // Fake users for testing
// const FAKE_USERS = [
//     {
//         id: '1',
//         phone: '+251924193212',
//         firstName: 'John',
//         lastName: 'Doe',
//         email: 'john.doe@example.com',
//         role: 'customer' as const,
//         isVerified: true,
//         createdAt: new Date().toISOString(),
//     },
//     {
//         id: '2',
//         phone: '+251922334455',
//         firstName: 'Sarah',
//         lastName: 'Johnson',
//         email: 'sarah.johnson@example.com',
//         role: 'customer' as const,
//         isVerified: true,
//         createdAt: new Date().toISOString(),
//     },
//     {
//         id: '3',
//         phone: '+251933445566',
//         firstName: 'Ahmed',
//         lastName: 'Hassan',
//         email: 'ahmed.hassan@example.com',
//         role: 'customer' as const,
//         isVerified: true,
//         createdAt: new Date().toISOString(),
//     },
//     {
//         id: '4',
//         phone: '+251944556677',
//         firstName: 'Meron',
//         lastName: 'Tadesse',
//         email: 'meron.tadesse@example.com',
//         role: 'service_rep' as const,
//         isVerified: true,
//         createdAt: new Date().toISOString(),
//     },
// ];

// // Fake OTP - always accept "123456"
// const FAKE_OTP = '123456';

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//     const [user, setUser] = useState<User | null>(null);
//     const [isLoading, setIsLoading] = useState(false);

//     useEffect(() => {
//         // Check for stored auth token on mount
//         const storedUser = localStorage.getItem('ethio_telecom_user');
//         if (storedUser) {
//             setUser(JSON.parse(storedUser));
//         }
//     }, []);

//     const sendOTP = async (phone: string): Promise<boolean> => {
//         setIsLoading(true);
//         try {
//             // Simulate API call to send OTP
//             await new Promise((resolve) => setTimeout(resolve, 1000));

//             // Check if phone number exists in fake users
//             const userExists = FAKE_USERS.find((u) => u.phone === phone);

//             if (userExists) {
//                 console.log(`✅ OTP sent to ${phone}: ${FAKE_OTP}`);
//                 return true;
//             } else {
//                 console.log(`❌ Phone number ${phone} not found in system`);
//                 return false;
//             }
//         } catch (error) {
//             console.error('Failed to send OTP:', error);
//             return false;
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const login = async (phone: string, otp: string): Promise<boolean> => {
//         setIsLoading(true);
//         try {
//             // Simulate API call to verify OTP
//             await new Promise((resolve) => setTimeout(resolve, 1000));

//             // Check if OTP is correct (always accept "123456")
//             if (otp !== FAKE_OTP) {
//                 console.log(`❌ Invalid OTP: ${otp}. Expected: ${FAKE_OTP}`);
//                 return false;
//             }

//             // Find user by phone number
//             const foundUser = FAKE_USERS.find((u) => u.phone === phone);

//             if (foundUser) {
//                 setUser(foundUser);
//                 localStorage.setItem('ethio_telecom_user', JSON.stringify(foundUser));
//                 console.log(`✅ Login successful for ${foundUser.firstName} ${foundUser.lastName}`);
//                 return true;
//             } else {
//                 console.log(`❌ User not found for phone: ${phone}`);
//                 return false;
//             }
//         } catch (error) {
//             console.error('Login failed:', error);
//             return false;
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const logout = () => {
//         setUser(null);
//         localStorage.removeItem('ethio_telecom_user');
//         console.log('✅ User logged out');
//     };

//     return <AuthContext.Provider value={{ user, login, logout, sendOTP, isLoading }}>{children}</AuthContext.Provider>;
// };
