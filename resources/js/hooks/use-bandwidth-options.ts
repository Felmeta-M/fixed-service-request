import { Option } from '@/types/customer';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface BandwidthOptionResponse {
    id: number;
    residential_options: string[];
    enterprise_options: string[];
}

export function useBandwidthOptions() {
    const [residentialOptions, setResidentialOptions] = useState<Option[]>([]);
    const [enterpriseOptions, setEnterpriseOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBandwidthOptions = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/v1/bandwidth-options');

                if (response.data.success) {
                    const data: BandwidthOptionResponse = response.data.data[0]; // only one object in array

                    const formattedResidential = data.residential_options.map((value) => ({
                        label: value,
                        value,
                    }));

                    const formattedEnterprise = data.enterprise_options.map((value) => ({
                        label: value,
                        value,
                    }));

                    setResidentialOptions(formattedResidential);
                    setEnterpriseOptions(formattedEnterprise);
                }
            } catch (err) {
                setError('Failed to fetch bandwidth options');
                console.error('Error fetching bandwidth options:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBandwidthOptions();
    }, []);

    return { residentialOptions, enterpriseOptions, loading, error };
}
