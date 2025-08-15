import AuthLayout from '@/layouts/AuthLayout';

type Props = {
    user: any;
    stats: {
        support_requests_count: number;
        recent_activity: { id: number; action: string; date: string }[];
    };
};

export default function Dashboard({ user, stats }: Props) {
    return (
        <AuthLayout>
            <h1 className="mb-4 text-2xl font-bold">Welcome, {user.phone}</h1>
            <div className="mb-6">
                <span className="font-semibold">Total Support Requests:</span> {stats.support_requests_count}
            </div>
            <div>
                <h2 className="mb-2 text-xl font-semibold">Recent Activity</h2>
                <ul className="ml-5 list-disc">
                    {stats.recent_activity.length === 0 ? (
                        <li>No recent activity</li>
                    ) : (
                        stats.recent_activity.map((activity) => (
                            <li key={activity.id}>
                                {activity.action} on {activity.date}
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </AuthLayout>
    );
}
