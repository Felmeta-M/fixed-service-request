import { Option } from '@/types/customer';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface SurveyType {
    id: number;
    name: string;
}

export function useSurveyTypes() {
    const [types, setTypes] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSurveyTypes = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:3000/api/v1/survey-types');
                console.log('response', response.data);
                const formattedSurveyTypes = response.data.map((type: SurveyType) => ({
                    label: type.name,
                    value: type.id.toString(),
                }));

                setTypes(formattedSurveyTypes);
            } catch (error) {
                setError('Failed to load types');
                console.error('Error loading types', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSurveyTypes();
    }, []);

    return { types, loading, error };
}
