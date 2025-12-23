import { Link } from "@inertiajs/react";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubscriptionSuccess() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl animate-fade-in-up">
                
                {/* Success Icon */}
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full animate-pop">
                        <CheckCircle className="h-10 w-10 text-primary" />
                    </div>

                    <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
                        Subscription Successful
                    </h2>

                    <p className="mt-2 text-sm text-gray-600">
                        Your service subscription has been successfully processed.
                        You can now enjoy your new service.
                    </p>
                </div>

                {/* Info Box */}
                <div className="mt-8 rounded-lg bg-blue-50 p-4 flex gap-3 animate-fade-in-up">
                    <Sparkles className="h-5 w-5 text-blue-500 mt-0.5 animate-pulse" />
                    <p className="text-sm text-blue-700">
                        You can view and manage your services anytime from the dashboard.
                    </p>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-col gap-3">
                    <Link href="/services" className="w-full">
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
