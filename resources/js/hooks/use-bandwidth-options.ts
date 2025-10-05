import axios from 'axios';
import { useEffect, useState } from 'react';

interface BandwidthOptionResponse {
    id: number;
    residential_options: string[];
    enterprise_options: string[];
}

export interface ProcessedBandwidthOption {
    label: string;
    value: string;
    numericValue: number;
}

export function useBandwidthOptions() {
    const [residentialOptions, setResidentialOptions] = useState<ProcessedBandwidthOption[]>([]);
    const [enterpriseOptions, setEnterpriseOptions] = useState<ProcessedBandwidthOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Function to convert bandwidth string to numeric value
    const parseBandwidthValue = (bandwidth: string): number => {
        // Remove any whitespace and convert to lowercase
        const cleanValue = bandwidth.trim().toLowerCase();

        // Check if it's in Gbps
        if (cleanValue.includes('gbps')) {
            const numericPart = parseFloat(cleanValue.replace('gbps', ''));
            return numericPart * 1024; // Convert Gbps to Mbps
        }

        // Check if it's in Mbps or just M
        if (cleanValue.includes('m') || cleanValue.includes('mbps')) {
            const numericPart = parseFloat(cleanValue.replace('mbps', '').replace('m', ''));
            return numericPart;
        }

        // If it's just a number, assume it's Mbps
        return parseFloat(cleanValue);
    };

    useEffect(() => {
        const fetchBandwidthOptions = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/v1/bandwidth-options');

                if (response.data.success) {
                    const data: BandwidthOptionResponse = response.data.data[0];

                    // Process residential options
                    const formattedResidential = data.residential_options.map((value) => ({
                        label: value,
                        value,
                        numericValue: parseBandwidthValue(value),
                    }));

                    // Process enterprise options
                    const formattedEnterprise = data.enterprise_options.map((value) => ({
                        label: value,
                        value,
                        numericValue: parseBandwidthValue(value),
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

    return { residentialOptions, enterpriseOptions, loading, error, parseBandwidthValue };
}
