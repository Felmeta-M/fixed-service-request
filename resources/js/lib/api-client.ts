/**
 * API Client utility for making HTTP requests
 * Replaces axios with native fetch API for better integration with TanStack Query
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ApiError extends Error {
    status?: number;
    data?: any;
    response?: Response;
}

export class ApiClientError extends Error implements ApiError {
    status?: number;
    data?: any;
    response?: Response;

    constructor(message: string, status?: number, data?: any, response?: Response) {
        super(message);
        this.name = 'ApiClientError';
        this.status = status;
        this.data = data;
        this.response = response;
    }
}

/**
 * Get authentication token from Inertia page props
 */
function getAuthToken(): string | null {
    try {
        // We'll get this dynamically from usePage hook when needed
        // For now, return null - components will pass it explicitly
        return null;
    } catch {
        return null;
    }
}

/**
 * Create headers with authentication if token is provided
 */
function createHeaders(token?: string | null, additionalHeaders?: Record<string, string>): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...additionalHeaders,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Handle response and parse JSON, throwing errors for non-OK responses
 * @param response - The fetch Response object
 * @param skipAuthRedirect - If true, don't redirect on 401 (for public endpoints)
 */
async function handleResponse<T>(response: Response, skipAuthRedirect: boolean = false): Promise<T> {
    // Handle 401 Unauthorized - redirect to OTP page (unless skipAuthRedirect is true)
    if (response.status === 401 && !skipAuthRedirect) {
        window.location.href = '/otp/phone';
        throw new ApiClientError('Unauthorized', 401, null, response);
    }

    // Parse response body
    let data: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
        try {
            data = await response.json();
        } catch (e) {
            // If JSON parsing fails, use empty object
            data = {};
        }
    } else {
        // For non-JSON responses, try to get text
        data = await response.text();
    }

    if (!response.ok) {
        const message = data?.message || data?.error || `Request failed with status ${response.status}`;
        throw new ApiClientError(message, response.status, data, response);
    }

    return data as T;
}

/**
 * API Client methods
 */
export const apiClient = {
    /**
     * GET request
     */
    async get<T>(
        endpoint: string,
        options?: {
            token?: string | null;
            params?: Record<string, string | number | undefined>;
            headers?: Record<string, string>;
            timeout?: number;
        }
    ): Promise<T> {
        const { token, params, headers, timeout = 15000 } = options || {};

        // Build URL with query parameters
        const url = new URL(endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
        }

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: createHeaders(token, headers),
                credentials: 'include',
                signal: controller.signal,
            });

            return await handleResponse<T>(response);
        } catch (error) {
            if (error instanceof ApiClientError) {
                throw error;
            }
            if (error instanceof Error && error.name === 'AbortError') {
                throw new ApiClientError('Request timeout', 408);
            }
            throw new ApiClientError(error instanceof Error ? error.message : 'Network error');
        } finally {
            clearTimeout(timeoutId);
        }
    },

    /**
     * POST request
     */
    async post<T>(
        endpoint: string,
        data?: any,
        options?: {
            token?: string | null;
            headers?: Record<string, string>;
            timeout?: number;
            /** Skip 401 redirect for public endpoints */
            skipAuthRedirect?: boolean;
        }
    ): Promise<T> {
        const { token, headers, timeout = 15000, skipAuthRedirect = false } = options || {};

        // Handle FormData (for file uploads)
        const isFormData = data instanceof FormData;
        const requestHeaders = isFormData
            ? { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            : createHeaders(token, headers);

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: requestHeaders,
                credentials: 'include',
                body: isFormData ? data : JSON.stringify(data),
                signal: controller.signal,
            });

            return await handleResponse<T>(response, skipAuthRedirect);
        } catch (error) {
            if (error instanceof ApiClientError) {
                throw error;
            }
            if (error instanceof Error && error.name === 'AbortError') {
                throw new ApiClientError('Request timeout', 408);
            }
            throw new ApiClientError(error instanceof Error ? error.message : 'Network error');
        } finally {
            clearTimeout(timeoutId);
        }
    },

    /**
     * PUT request
     */
    async put<T>(
        endpoint: string,
        data?: any,
        options?: {
            token?: string | null;
            headers?: Record<string, string>;
            timeout?: number;
        }
    ): Promise<T> {
        const { token, headers, timeout = 15000 } = options || {};

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: createHeaders(token, headers),
                credentials: 'include',
                body: JSON.stringify(data),
                signal: controller.signal,
            });

            return await handleResponse<T>(response);
        } catch (error) {
            if (error instanceof ApiClientError) {
                throw error;
            }
            if (error instanceof Error && error.name === 'AbortError') {
                throw new ApiClientError('Request timeout', 408);
            }
            throw new ApiClientError(error instanceof Error ? error.message : 'Network error');
        } finally {
            clearTimeout(timeoutId);
        }
    },

    /**
     * PATCH request
     */
    async patch<T>(
        endpoint: string,
        data?: any,
        options?: {
            token?: string | null;
            headers?: Record<string, string>;
            timeout?: number;
        }
    ): Promise<T> {
        const { token, headers, timeout = 15000 } = options || {};

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`, {
                method: 'PATCH',
                headers: createHeaders(token, headers),
                credentials: 'include',
                body: JSON.stringify(data),
                signal: controller.signal,
            });

            return await handleResponse<T>(response);
        } catch (error) {
            if (error instanceof ApiClientError) {
                throw error;
            }
            if (error instanceof Error && error.name === 'AbortError') {
                throw new ApiClientError('Request timeout', 408);
            }
            throw new ApiClientError(error instanceof Error ? error.message : 'Network error');
        } finally {
            clearTimeout(timeoutId);
        }
    },

    /**
     * DELETE request
     */
    async delete<T>(
        endpoint: string,
        options?: {
            token?: string | null;
            headers?: Record<string, string>;
            timeout?: number;
            body?: any;
        }
    ): Promise<T> {
        const { token, headers, timeout = 15000, body } = options || {};

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const fetchOptions: RequestInit = {
                method: 'DELETE',
                headers: createHeaders(token, headers),
                credentials: 'include',
                signal: controller.signal,
            };

            if (body) {
                fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
            }

            const response = await fetch(endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`, fetchOptions);

            return await handleResponse<T>(response);
        } catch (error) {
            if (error instanceof ApiClientError) {
                throw error;
            }
            if (error instanceof Error && error.name === 'AbortError') {
                throw new ApiClientError('Request timeout', 408);
            }
            throw new ApiClientError(error instanceof Error ? error.message : 'Network error');
        } finally {
            clearTimeout(timeoutId);
        }
    },
};

