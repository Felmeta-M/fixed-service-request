import { Option } from '@/types/customer';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Region {
    id: number;
    name: string;
}

export function useRegions() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['regions'],
        queryFn: async () => {
            const response = await apiClient.get<Region[]>('/locations/regions');
            return response.map((region) => ({
                label: region.name,
                value: region.id.toString(),
            }));
        },
    });

    return {
        regions: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to load regions') : null,
    };
}

export function useZones(regionValue?: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['zones', regionValue],
        queryFn: async () => {
            if (!regionValue) return [];
            const response = await apiClient.get<Region[]>(`/locations/zones/${regionValue}`);
            return response.map((zone) => ({
                label: zone.name,
                value: zone.id.toString(),
            }));
        },
        enabled: !!regionValue,
    });

    return {
        zones: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to load zones') : null,
    };
}

export function useWoredas(zoneValue?: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['woredas', zoneValue],
        queryFn: async () => {
            if (!zoneValue) return [];
            const response = await apiClient.get<Region[]>(`/locations/weredas/${zoneValue}`);
            return response.map((woreda) => ({
                label: woreda.name,
                value: woreda.id.toString(),
            }));
        },
        enabled: !!zoneValue,
    });

    return {
        woredas: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to load woredas') : null,
    };
}

interface TelecomRegion {
    id: number;
    area_id: string;
    area_name: string;
    zone: string;
}

interface TelecomRegionsResponse {
    success: boolean;
    data: TelecomRegion[];
    count: number;
    ethio_zone?: string;
}

export function useTelecomRegionsByZone(zoneValue?: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['telecom-regions-by-zone', zoneValue],
        queryFn: async () => {
            if (!zoneValue) return [];
            const response = await apiClient.get<TelecomRegionsResponse>(`/telecom-regions/by-zone?zone_id=${zoneValue}`);
            if (!response.success || !response.data) return [];
            return response.data.map((region) => ({
                label: region.area_name,
                value: region.area_id,
                zone: region.zone,
            }));
        },
        enabled: !!zoneValue,
    });

    return {
        telecomRegions: data || [],
        loading: isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to load telecom regions') : null,
    };
}
