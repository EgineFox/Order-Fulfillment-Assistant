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

export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface OrderRow {
    externalId: string;
    orderName: string;
    shippingAddress: string;
    shippingPhone: string;
    shippingCity?: string;
    customerName?: string;
    orderDate: Date;
    sku: string;
    barcode?: string;
    productName: string;
    quantity: number;
    inventory?: string;
    location?: string;
}

export interface OrderGroup {
    externalId: string;
    orderName: string;
    customerName?: string;
    shippingAddress?: string;
    shippingCity?: string;
    orderDate: Date;
    items: OrderItemGroup[];
    totalItemsCount: number;
}

export interface OrderItemGroup {
    sku: string;
    productName: string;
    quantity: number;
    availableStores: number[];
    locationCode?: string;
}

export interface AllocationResult {
    orderId: string;
    sku: string;
    productName: string;
    quantity: number;
    status: 'main_warehouse' | 'stores' | 'insufficient';
    warehouse?: number;
    allocations?:  StoreAllocation[];
    missingQuantity?: number;
}

export interface StoreAllocation {
    storeId: number;
    quantity: number;
}

export interface StoreRequest {
    storeId: number;
    storeName: string;
    managerPhone?: string;
    items: RequestItems[];
    messageText: string;
}

export interface RequestItems {
    orderId: string;
    sku: string;
    productName: string;
    quantity: number;
}

export interface ParseError {
  row: number;
  externalId: string;
  message: string;
}

// Delivery Route types
export interface DeliveryRoute {
  id: number;
  dayOfWeek: number;
  stores: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRouteInput {
  dayOfWeek: number;
  stores: string;
}

export interface UpdateRouteInput {
  dayOfWeek?: number;
  stores?: string;
  isActive?: boolean;
}