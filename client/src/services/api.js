import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';
console.log('API URL:', API_URL);

// Create axios instance with default config
// Note: do NOT set a global 'Content-Type' here so FormData uploads retain the
// browser-generated Content-Type (including multipart boundary).
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true,
  timeout: 10000 // 10 second timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    // Prefer sessionStorage so auth is cleared when the browser/tab is closed
    const token = window.sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'An error occurred';
    const status = error?.response?.status;
    const url = error?.config?.url;
    console.error('API Error:', { url, status, message: errorMessage, error: error?.message });
    // Preserve the original Axios error so downstream code can access error.response, etc.
    return Promise.reject(error);
  }
);

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('Request URL:', config.url);
    console.log('Full URL:', config.baseURL + config.url);
    console.log('Request Headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    const url = error?.config?.url || '(no config url)';
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error('Response Error:', url, status, data);
    return Promise.reject(error);
  }
);

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = window.sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      window.sessionStorage.removeItem('token');
      // Optionally also clear the header if set
      if (api?.defaults?.headers?.common?.Authorization) {
        delete api.defaults.headers.common['Authorization'];
      }
      window.location.href = '/login';
    }
    // Always reject the original Axios error so callers can inspect error.response
    return Promise.reject(error);
  }
);

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getOverview: () => api.get('/dashboard/overview'),
  getActivities: (params = {}) => api.get('/dashboard/activities', { params }),
};

// Countries API
export const countriesApi = {
  getAll: async (params) => {
    try {
      const response = await api.get('/countries', { params });
      // Server returns { success, count, data: [...] }
      const data = Array.isArray(response?.data?.data) ? response.data.data : [];
      const total = typeof response?.data?.count === 'number' ? response.data.count : data.length;
      return { data, pagination: { total } };
    } catch (error) {
      console.error('Error fetching countries:', error);
      return { data: [], pagination: { total: 0 } };
    }
  },
  getById: (id) => api.get(`/countries/${id}`),
  create: async (data) => {
    try {
      return await api.post('/countries', data);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to create country';
      throw new Error(message);
    }
  },
  update: async (id, data) => {
    try {
      return await api.put(`/countries/${id}`, data);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to update country';
      throw new Error(message);
    }
  },
  delete: async (id, options = {}) => {
    try {
      const params = {};
      if (options.force === true) {
        params.force = true;
      }
      return await api.delete(`/countries/${id}`, { params });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to delete country';
      throw new Error(message);
    }
  },
  getCompanies: (id) => api.get(`/countries/${id}/companies`),
  getPeople: (id) => api.get(`/countries/${id}/people`)
};

// Companies API
export const companiesApi = {
  getAll: async (params) => {
    try {
      const response = await api.get('/companies', { params });
      // Server returns { success, pagination, data: [...] }
      const data = Array.isArray(response?.data?.data) ? response.data.data : [];
      const total = typeof response?.data?.pagination?.total === 'number' 
        ? response.data.pagination.total 
        : data.length;
      return { data, pagination: { total } };
    } catch (error) {
      console.error('Error fetching companies:', error);
      return { data: [], pagination: { total: 0 } };
    }
  },
  getById: (id) => api.get(`/companies/${id}`),
  create: async (data) => {
    try {
      return await api.post('/companies', data);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to create company';
      throw new Error(message);
    }
  },
  update: async (id, data) => {
    try {
      return await api.put(`/companies/${id}`, data);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to update company';
      throw new Error(message);
    }
  },
  delete: async (id) => {
    try {
      return await api.delete(`/companies/${id}`);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to delete company';
      throw new Error(message);
    }
  },
  getPeople: (id) => api.get(`/companies/${id}/people`),
  addIpAddress: (id, ipAddress) => api.post(`/companies/${id}/ips`, { ipAddress }),
  removeIpAddress: (id, ip) => api.delete(`/companies/${id}/ips/${ip}`),
  addSubdomain: (id, subdomain) => api.post(`/companies/${id}/subdomains`, { subdomain }),
  removeSubdomain: (id, subdomain) => api.delete(`/companies/${id}/subdomains/${subdomain}`),
};

// People API
export const peopleApi = {
  getAll: async (params) => {
    try {
      const response = await api.get('/people', { params });
      // Server returns { success, pagination, data: [...] }
      const data = Array.isArray(response?.data?.data) ? response.data.data : [];
      const total = typeof response?.data?.pagination?.total === 'number'
        ? response.data.pagination.total
        : data.length;
      return { data, pagination: { total } };
    } catch (error) {
      console.error('Error fetching people:', error);
      return { data: [], pagination: { total: 0 } };
    }
  },
  getById: (id) => api.get(`/people/${id}`),
  create: async (data) => {
    try {
      return await api.post('/people', data);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (Array.isArray(error?.response?.data?.errors) ? error.response.data.errors.map(e=>e.msg).join(', ') : null) ||
        error?.message ||
        'Failed to create person';
      throw new Error(message);
    }
  },
  update: async (id, data) => {
    try {
      return await api.put(`/people/${id}`, data);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (Array.isArray(error?.response?.data?.errors) ? error.response.data.errors.map(e=>e.msg).join(', ') : null) ||
        error?.message ||
        'Failed to update person';
      throw new Error(message);
    }
  },
  delete: async (id) => {
    try {
      return await api.delete(`/people/${id}`);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to delete person';
      throw new Error(message);
    }
  },
  getByCountry: (countryId) => api.get(`/people/country/${countryId}`),
  getByCompany: (companyId) => api.get(`/people/company/${companyId}`),
  updateStatus: (id, isActive) => api.patch(`/people/${id}/status`, { isActive }),
  uploadPhoto: async (id, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Do not set Content-Type header manually; let the browser set the correct boundary
      const res = await api.put(`/people/${id}/photo`, formData);
      // Server returns the updated person document in res.data.data
      return res.data.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to upload photo';
      throw new Error(message);
    }
  },
};

export default api;
