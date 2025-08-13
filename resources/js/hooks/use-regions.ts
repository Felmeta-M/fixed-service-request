import { Option } from '@/types/customer';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface Region {
    id: number;
    name: string;
}

export function useRegions() {
    const [regions, setRegions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRegions = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:8000/api/v1/locations/regions');
                console.log('response', response.data);
                const formattedRegions = response.data.map((region: Region) => ({
                    label: region.name,
                    value: region.id.toString(),
                }));

                setRegions(formattedRegions);
            } catch (error) {
                setError('Failed to load regions');
                console.error('Error loading regions', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRegions();
    }, []);

    return { regions, loading, error };
}

export function useZones(regionValue?: string) {
    const [zones, setZones] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchZones = async () => {
            try {
                if (regionValue) {
                    setLoading(true);
                    const response = await axios.get(`http://localhost:8000/api/v1/locations/zones/${regionValue}`);
                    const formattedZones = response.data.map((zone: Region) => ({
                        label: zone.name,
                        value: zone.id.toString(),
                    }));
                    setZones(formattedZones);
                } else {
                    setZones([]);
                }
            } catch (error) {
                setError('Failed to load zones');
                console.error('Error loading zones', error);
            } finally {
                setLoading(false);
            }
        };
        fetchZones();
    }, [regionValue]);
    return { zones, loading, error };
}

export function useWoredas(zoneValue?: string) {
    const [woredas, setWoredas] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWoredas = async () => {
            try {
                if (zoneValue) {
                    setLoading(true);
                    const response = await axios.get(`http://localhost:8000/api/v1/locations/weredas/${zoneValue}`);
                    const formattedWoredas = response.data.map((woreda: Region) => ({
                        label: woreda.name,
                        value: woreda.id.toString(),
                    }));
                    setWoredas(formattedWoredas);
                } else {
                    setWoredas([]);
                }
            } catch (error) {
                setError('Failed to load woredas');
                console.error('Error loading woredas', error);
            } finally {
                setLoading(false);
            }
        };
        fetchWoredas();
    }, [zoneValue]);
    return { woredas, loading, error };
}
