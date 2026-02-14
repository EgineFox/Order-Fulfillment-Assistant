import axios from 'axios';
import type { AuthResponse, User, Store, FileUpload, ProcessFileResponse } from '../types';

// Base URL for API
const API_URL = 'http://localhost:3000/api';

// Create AXIOS instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const authAPI = {
    register: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', { email, password, name});
        return response.data;
    },

    login: async (email: string, password: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', { email, password });
        return response.data;
    },

    getMe: async (): Promise<{ user: User} > => {
        const response = await api.get<{ user: User}>('/auth/me');
        return response.data;
    },
};

// Files API
export const filesAPI = {
    upload: async (file: File): Promise< { fileId: number; filename: string }> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                },
        });
        return response.data;
    },
    process: async (fileId: number, excludedStores: number[] = []): Promise<ProcessFileResponse> => {
        const response = await api.post<ProcessFileResponse>(`/files/${fileId}/process`, {
            excludedStores,
        });
        return response.data;
    },

    getFiles: async (): Promise<{ files: FileUpload[] }> => {
        const response = await api.get<{ files: FileUpload[] }> ('/files');
        return response.data;
    },
};

// Stores API
export const storesAPI = {
    getAll: async (): Promise<{ stores: Store[] }> => {
        const response = await api.get<{ stores: Store[] }> ('/stores');
        return response.data;
    },
};

// Routes API
export const routesAPI = {
  getAll: async (): Promise<{ routes: DeliveryRoute[] }> => {
    const response = await api.get<{ routes: DeliveryRoute[] }>('/routes');
    return response.data;
  },
};  

export default api;