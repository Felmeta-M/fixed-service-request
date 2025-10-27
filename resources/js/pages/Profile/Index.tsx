import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/AuthLayout';
import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const ProfilePage = () => {
    const [userData, setUserData] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState('eng');
    const [activeTab, setActiveTab] = useState('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const activeCustomer = JSON.parse(localStorage.getItem('activeCustomer'));
        if (activeCustomer) {
            setUserData(activeCustomer);
            initializeEditForm(activeCustomer);
        }
    }, []);

    const initializeEditForm = (data) => {
        setEditForm({
            first_name: data.customer?.first_name || '',
            middle_name: data.customer?.middle_name || '',
            last_name: data.customer?.last_name || '',
            email: data.nid_identity?.email || '',
            phone: data.nid_identity?.phone || '',
        });
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const getProfileImage = () => {
        if (imageError || !userData?.nid_identity?.photo_base64) {
            const initials =
                getDisplayValue(userData?.nid_identity?.name)
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || 'U';

            return (
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white shadow-lg">
                    {initials}
                </div>
            );
        }

        return (
            <img
                src={`data:image/jpeg;base64,${userData.nid_identity.photo_base64}`}
                alt="Profile"
                onError={handleImageError}
                className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
            />
        );
    };

    const handleSave = () => {
        router.patch('/profile', editForm, {
            onSuccess: (page) => {
                const updatedData = {
                    ...userData,
                    customer: {
                        ...userData.customer,
                        ...editForm,
                    },
                    nid_identity: {
                        ...userData.nid_identity,
                        email: editForm.email,
                        phone: editForm.phone,
                    },
                };
                localStorage.setItem('activecustomer', JSON.stringify(updatedData));
                setUserData(updatedData);
                setIsEditing(false);
            },
        });
    };

    const handleCancel = () => {
        setIsEditing(false);
        initializeEditForm(userData);
    };

    const formatDateOfBirth = (dobString) => {
        if (!dobString) return '';
        const year = dobString.substring(0, 4);
        const month = dobString.substring(4, 6);
        const day = dobString.substring(6, 8);
        return `${year}-${month}-${day}`;
    };

    const getDisplayValue = (field) => {
        if (typeof field === 'object') {
            return field[selectedLanguage] || field.eng || '';
        }
        return field || '';
    };

    if (!userData) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    const { customer, nid_identity, addresses, contacts, auth_method } = userData;

    return (
        <AuthLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    {/* Profile Header with Image */}
                    <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                        {/* <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-700"></div> */}
                        <div className="h-32 bg-primary"></div>
                        <div className="px-8 pb-8">
                            <div className="-mt-20 flex flex-col items-start md:-mt-16 md:flex-row md:items-end">
                                {/* Profile Image */}
                                <div className="relative mb-4 md:mr-6 md:mb-0">
                                    {getProfileImage()}
                                    <div className="absolute right-2 bottom-2 h-6 w-6 rounded-full border-2 border-white bg-green-500"></div>
                                </div>

                                {/* User Info */}
                                <div className="flex-1">
                                    <div className="flex flex-col justify-between md:flex-row md:items-end">
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-900">{getDisplayValue(nid_identity?.name)}</h1>
                                            <p className="mt-1 text-lg text-gray-600">
                                                Customer ID: <span className="rounded bg-gray-100 px-2 py-1 font-mono">{customer?.id}</span>
                                            </p>
                                        </div>

                                        <div className="mt-4 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 md:mt-0">
                                            <select
                                                value={selectedLanguage}
                                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            >
                                                <option value="eng">English</option>
                                                <option value="amh">አማርኛ</option>
                                            </select>
                                            {/* {!isEditing ? (
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg"
                                                >
                                                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                    </svg>
                                                    Edit Profile
                                                </button>
                                            ) : (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={handleSave}
                                                        className="flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-white shadow-md transition-colors hover:bg-green-700"
                                                    >
                                                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancel}
                                                        className="flex items-center justify-center rounded-lg bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
                                                    >
                                                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M6 18L18 6M6 6l12 12"
                                                            />
                                                        </svg>
                                                        Cancel
                                                    </button>
                                                </div>
                                            )} */}
                                            <Button>
                                                <Link href="/dashboard">Go to Dashboard</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Left Sidebar - Quick Info */}
                        <div className="space-y-6 lg:col-span-1">
                            {/* KYC Status Card */}
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">Verification Status</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">KYC Status</span>
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                            <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                                            Verified
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Auth Method</span>
                                        <span className="text-sm font-medium text-gray-900 uppercase">{auth_method}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Provider</span>
                                        <span className="text-sm font-medium text-gray-900">Ethio Telecom</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Quick View */}
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Contact</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Phone Number</p>
                                            <p className="text-sm font-medium text-gray-900">{nid_identity?.phone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
                                            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Email Address</p>
                                            <p className="text-sm font-medium text-gray-900">{nid_identity?.email || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contacts */}
                            {contacts && contacts.length > 0 && (
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Emergency Contacts</h3>
                                    <div className="space-y-4">
                                        {contacts.map((contact, index) => (
                                            <div key={index} className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                                                <div className="mb-2 flex items-center">
                                                    <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                                        <svg
                                                            className="h-4 w-4 text-orange-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <span className="text-sm font-medium text-orange-800">Contact {index + 1}</span>
                                                </div>
                                                <p className="text-sm text-gray-700">
                                                    {contact.name1} {contact.name2}
                                                </p>
                                                <p className="text-sm font-medium text-gray-900">{contact.mobile}</p>
                                                {contact.fax && <p className="text-xs text-gray-500">Fax: {contact.fax}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <div className="border-b border-gray-200">
                                    <nav className="-mb-px flex">
                                        {['personal', 'contact', 'address'].map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`border-b-2 px-6 py-4 text-sm font-medium transition-colors ${
                                                    activeTab === tab
                                                        ? 'border-blue-500 text-blue-600'
                                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                                }`}
                                            >
                                                {tab.charAt(0).toUpperCase() + tab.slice(1)} Information
                                            </button>
                                        ))}
                                    </nav>
                                </div>

                                <div className="p-6">
                                    {/* Personal Information Tab */}
                                    {activeTab === 'personal' && (
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {isEditing ? (
                                                <>
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">First Name</label>
                                                        <input
                                                            type="text"
                                                            value={editForm.first_name}
                                                            onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">Middle Name</label>
                                                        <input
                                                            type="text"
                                                            value={editForm.middle_name}
                                                            onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })}
                                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">Last Name</label>
                                                        <input
                                                            type="text"
                                                            value={editForm.last_name}
                                                            onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                                                        <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                                                        <p className="mt-1 text-lg font-semibold text-gray-900">
                                                            {getDisplayValue(nid_identity?.name)}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                                                        <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                                                        <p className="mt-1 text-lg font-semibold text-gray-900">
                                                            {formatDateOfBirth(nid_identity?.dob)}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                                                        <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                                                        <p className="mt-1 text-lg font-semibold text-gray-900">
                                                            {getDisplayValue(nid_identity?.gender)}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                                                        <h3 className="text-sm font-medium text-gray-500">Nationality</h3>
                                                        <p className="mt-1 text-lg font-semibold text-gray-900">
                                                            {getDisplayValue(nid_identity?.nationality)}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                                                        <h3 className="text-sm font-medium text-gray-500">Customer Code</h3>
                                                        <p className="mt-1 font-mono text-lg font-semibold text-gray-900">{customer?.code}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Contact Information Tab */}
                                    {activeTab === 'contact' && (
                                        <div className="space-y-6">
                                            {isEditing ? (
                                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">Phone Number</label>
                                                        <input
                                                            type="tel"
                                                            value={editForm.phone}
                                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
                                                        <input
                                                            type="email"
                                                            value={editForm.email}
                                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                    <div className="rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                                                        <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                                                        <p className="mt-1 text-lg font-semibold text-gray-900">
                                                            {nid_identity?.phone || 'Not provided'}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                                                        <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                                                        <p className="mt-1 text-lg font-semibold text-gray-900">
                                                            {nid_identity?.email || 'Not provided'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Address Information Tab */}
                                    {activeTab === 'address' && (
                                        <div className="space-y-6">
                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                                                <h3 className="mb-3 text-lg font-semibold text-blue-900">Registered Address</h3>
                                                <p className="text-lg text-gray-800">{getDisplayValue(nid_identity?.address)}</p>
                                            </div>

                                            {addresses && addresses.length > 0 && (
                                                <div>
                                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Additional Addresses</h3>
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                        {addresses.map((address, index) => (
                                                            <div
                                                                key={index}
                                                                className="rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-300 hover:shadow-md"
                                                            >
                                                                <div className="mb-3 flex items-center">
                                                                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                                                        <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                                                                    </div>
                                                                    <h4 className="font-medium text-gray-900">Address {index + 1}</h4>
                                                                </div>
                                                                <div className="space-y-2 text-sm text-gray-600">
                                                                    {address.address1 && (
                                                                        <p className="flex justify-between">
                                                                            <span>Address 1:</span>{' '}
                                                                            <span className="font-medium">{address.address1}</span>
                                                                        </p>
                                                                    )}
                                                                    {address.address2 && (
                                                                        <p className="flex justify-between">
                                                                            <span>Address 2:</span>{' '}
                                                                            <span className="font-medium">{address.address2}</span>
                                                                        </p>
                                                                    )}
                                                                    {address.address3 && (
                                                                        <p className="flex justify-between">
                                                                            <span>Address 3:</span>{' '}
                                                                            <span className="font-medium">{address.address3}</span>
                                                                        </p>
                                                                    )}
                                                                    {address.address4 && (
                                                                        <p className="flex justify-between">
                                                                            <span>Address 4:</span>{' '}
                                                                            <span className="font-medium">{address.address4}</span>
                                                                        </p>
                                                                    )}
                                                                    {address.address5 && (
                                                                        <p className="flex justify-between">
                                                                            <span>Address 5:</span>{' '}
                                                                            <span className="font-medium">{address.address5}</span>
                                                                        </p>
                                                                    )}
                                                                    {address.address6 && (
                                                                        <p className="flex justify-between">
                                                                            <span>Address 6:</span>{' '}
                                                                            <span className="font-medium">{address.address6}</span>
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
};

export default ProfilePage;
