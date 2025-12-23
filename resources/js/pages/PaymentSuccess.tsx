import { Link } from "@inertiajs/react";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl animate-fade-in-up">

                {/* Success Icon & Title */}
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full animate-pop">
                        <CheckCircle className="h-10 w-10 text-primary" />
                    </div>

                    <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
                        Payment Successful
                    </h2>

                    <p className="mt-2 text-sm text-gray-600">
                        Your payment has been successfully processed and confirmed.
                    </p>
                </div>

                {/* Payment Details */}
                {/* <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
                    <div className="flex justify-between">
                        <span className="font-medium">Amount Paid</span>
                        <span>
                            {currency} {amount}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-medium">Transaction Reference</span>
                        <span className="truncate max-w-[160px] text-right">
                            {reference}
                        </span>
                    </div>
                </div> */}

                {/* Info Box */}
                <div className="mt-6 rounded-lg bg-blue-50 p-4 flex gap-3 animate-fade-in-up">
                    {/* <Sparkles className="h-5 w-5 text-blue-500 mt-0.5 animate-pulse" /> */}
                    <p className="text-sm text-blue-700">
                        You can review your payment history and manage services from the dashboard at any time.
                    </p>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-col gap-3">
                    <Link href={route("services")} className="w-full group">
                        <Button
                            className="
                                w-full flex items-center justify-center gap-2
                                transition-all duration-200
                                hover:scale-[1.03]
                                active:scale-[0.97]
                            "
                        >
                            Go to Dashboard
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
