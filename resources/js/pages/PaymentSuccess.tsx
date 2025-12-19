import { Link } from "@inertiajs/react";

interface PaymentSuccessProps {
    amount: string;
    currency: string;
    reference: string;
}

export default function PaymentSuccess({
    amount,
    currency,
    reference,
}: PaymentSuccessProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
            <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center">

                {/* Success Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                    <svg
                        className="h-8 w-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>

                {/* Title */}
                <h1 className="mt-4 text-2xl font-bold text-gray-800">
                    Payment Successful 🎉
                </h1>

                {/* Message */}
                <p className="mt-2 text-gray-600">
                    Thank you for your payment! Your transaction was completed
                    successfully.
                </p>

                {/* Payment Details */}
                <div className="mt-4 text-sm text-gray-500 space-y-1">
                    <p>
                        <span className="font-medium text-gray-700">
                            Amount:
                        </span>{" "}
                        {currency} {amount}
                    </p>
                    <p>
                        <span className="font-medium text-gray-700">
                            Reference:
                        </span>{" "}
                        {reference}
                    </p>
                </div>

                {/* Action Button */}
                <Link
                    href={route("services")}
                    className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition"
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}
