import axios from 'axios';
import { useEffect, useState } from 'react';

interface Occupation {
    id: number;
    remark: string;
}

export function useOccupations() {
    const [occupations, setOccupations] = useState<{ label: string; value: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOccupations = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/occupations');
                if (response.data.success) {
                    const formattedOccupations = response.data.data.map((occ: Occupation) => ({
                        label: occ.remark,
                        value: occ.id.toString(),
                    }));
                    setOccupations(formattedOccupations);
                }
            } catch (err) {
                setError('Failed to fetch occupations');
                console.error('Error fetching occupations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOccupations();
    }, []);

    return { occupations, loading, error };
}
