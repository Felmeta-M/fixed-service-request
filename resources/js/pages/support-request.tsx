import SimpleLayout from '@/layouts/simple-layout';

type Props = {
    user: any;
    requests: { id: number; title: string; status: string }[];
};

export default function SupportRequest({ user, requests }: Props) {
    return (
        <SimpleLayout>
            <h1 className="mb-4 text-2xl font-bold">Support Requests for {user.name}</h1>
            <table className="w-full rounded border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2">ID</th>
                        <th className="border p-2">Title</th>
                        <th className="border p-2">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((req) => (
                        <tr key={req.id} className="text-center">
                            <td className="border p-2">{req.id}</td>
                            <td className="border p-2">{req.title}</td>
                            <td className="border p-2">{req.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </SimpleLayout>
    );
}
