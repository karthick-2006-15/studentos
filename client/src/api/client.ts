const BASE_URL = import.meta.env.VITE_API_URL
  ? `${(import.meta.env.VITE_API_URL as string).replace(/\/+$/, '')}/api`
  : '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...customConfig } = options;

    let url = `${BASE_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;
    const authHeaders: Record<string, string> = {};
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers
      },
      ...customConfig
    };

    const response = await fetch(url, config);

    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = data?.message || response.statusText || 'An error occurred';
      throw new Error(errorMsg);
    }

    return data as T;
  }

  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'File upload failed');
    }

    return data as T;
  }
}

export const api = new ApiClient();
