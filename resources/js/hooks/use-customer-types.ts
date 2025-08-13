import { Option } from '@/types/customer';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface CustomerType {
    id: number;
    name: string;
    api_value: number;
}

export function useCustomerTypes() {
    const [types, setTypes] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCustomerTypes = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:8000/api/v1/customer/types');
                console.log('response', response.data);
                const formattedCustomerTypes = response.data.map((type: CustomerType) => ({
                    label: type.name,
                    value: type.id.toString(),
                }));

                setTypes(formattedCustomerTypes);
            } catch (error) {
                setError('Failed to load types');
                console.error('Error loading types', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomerTypes();
    }, []);

    return { types, loading, error };
}

export function useCustomerCategories(typeValue?: string) {
    const [categories, setCategories] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCustomerCategories = async () => {
            try {
                if (typeValue) {
                    setLoading(true);
                    const response = await axios.get('http://localhost:8000/api/v1/customer/categories', { params: { type_id: typeValue } });
                    const formattedCustomerCategories = response.data.map((category: CustomerType) => ({
                        label: category.name,
                        value: category.id.toString(),
                    }));
                    setCategories(formattedCustomerCategories);
                } else {
                    setCategories([]);
                }
            } catch (error) {
                setError('Failed to load categories');
                console.error('Error loading categories', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomerCategories();
    }, [typeValue]);
    return { categories, loading, error };
}

export function useCustomerSubcategories(categoryValue?: string) {
    const [subcategories, setSubcategories] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCustomerSubCategories = async () => {
            try {
                if (categoryValue) {
                    setLoading(true);
                    const response = await axios.get('http://localhost:8000/api/v1/customer/subcategories', {
                        params: { category_id: categoryValue },
                    });
                    const formattedCustomerSubcategories = response.data.map((subcategory: CustomerType) => ({
                        label: subcategory.name,
                        value: subcategory.id.toString(),
                    }));
                    setSubcategories(formattedCustomerSubcategories);
                } else {
                    setSubcategories([]);
                }
            } catch (error) {
                setError('Failed to load subcategories');
                console.error('Error loading subcategories', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomerSubCategories();
    }, [categoryValue]);
    return { subcategories, loading, error };
}
