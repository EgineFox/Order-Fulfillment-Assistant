// User types
export interface User {
    id: number;
    email: string;
    name?: string;
    role: string;
}

export interface AuthResponse {
    token: string;
    user: User;
} 

// Store types
export interface Store {
    id: number;
    name: string;
    address?: string;
    city?: string;
    managerName?: string;
    managerPhone?: string;
    isMainWarehouse: boolean; 
}

// File types
export interface FileUpload {
    id: number;
    filename: string;
    uloadedAt: string;
    processedAt?: string;
    status: string;
    totalRows?: number;
}

// Distribution results
export interface AllocationResult {
    orderId: string;
    sku: string;
    productName: string;
    quantity: number;
    status: 'main_warehouse' | 'stores' | 'insufficient';
    warehouse?: number;
    allocations?: StoreAllocation[];
    missingQuantity?: number;
    locationCode?: string;
    availableStores?: number[];
}

export interface StoreAllocation {
    storeId: number;
    quantity: number;
}

export interface StoreRequest {
    storeId: number;
    storeName: string;
    managerPhone?: string;
    items: RequestItem[];
    messageText: string;
    
}

export interface RequestItem {
    orderId: string;
    sku: string;
    productName: string;
    quantity: number;
    availableStores?: number[];
}

export interface ParseError {
    row: number;
    externalId: string;
    message: string;
}

export interface ProcessFileResponse {
    message: string;
    totalRows: number;
    fileId: number;
    results: {
        mainWarehouse: AllocationResult[];
        storeRequests: StoreRequest[];
        insufficient: AllocationResult[];
    };
    parseError?: ParseError[];
}

// Delivery Route types
export interface DeliveryRoute {
  id: number;
  dayOfWeek: number;
  stores: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}