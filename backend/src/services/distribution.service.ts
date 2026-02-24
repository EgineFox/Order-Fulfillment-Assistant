import { OrderRow, OrderGroup, OrderItemGroup, StoreAllocation } from '../types';
import prisma from '../config/database';

// Main warehouses
const MAIN_WAREHOUSES = [1, 69, 70, 79];

export interface DistributionResults {
  mainWarehouse: {
    orderId: string;
    sku: string;
    productName: string;
    quantity: number;
    status: 'main_warehouse';
    warehouse: number;
    locationCode?: string;
    availableStores?: number[];
  }[];
  storeRequests: {
    storeId: number;
    storeName: string;
    managerPhone?: string;
    items: {
      orderId: string;
      sku: string;
      productName: string;
      quantity: number;
      availableStores?: number[];
    }[];
    messageText: string;
  }[];
  insufficient: {
    orderId: string;
    sku: string;
    productName: string;
    quantity: number;
    status: 'insufficient';
    missingQuantity: number;
    availableStores?: number[];
  }[];
}

// HELPER FUNCTIONS

// Parse inventory string: "1, 10, 11, 12" → [1, 10, 11, 12]
const parseInventory = (inventory?: string | null): number[] => {
  if (!inventory) return [];

  try {
    // Convert to string first (in case it's a number)
    const inventoryStr = String(inventory);

    return inventoryStr
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));
  } catch (error) {
    console.error('Parse inventory error:', error);
    return [];
  }
};

// Generate Hebrew message
const generateMessage = (request: DistributionResults['storeRequests'][0]): string => {
  let msg = 'שלום!\n';
  msg += 'צריכים סחורה:\n\n';

  // Single item - no numbering
  if (request.items.length === 1) {
    const item = request.items[0];
    return `שלום!\nצריכים סחורה:\n\n${item.productName}\n ${item.sku}\n\nתודה רבה!`;
  }

  // Multiple items - with numbering
  const itemsText = request.items
    .map((item, index) => {
      return `${index + 1}. ${item.productName}\n  ${item.sku}`;
    })
    .join('\n\n');

  return `שלום!\nצריכים סחורה:\n\n${itemsText}\n\nתודה רבה!`;
};

// MAIN DISTRIBUTION FUNCTION

export const distributeOrders = async (
  orders: OrderRow[],
  deliveryDate?: Date,
  excludedStores: number[] = []
): Promise<DistributionResults> => {
  console.log('Starting distribution algorithm');
  console.log(`Total items: ${orders.length}`);


  // Determine delivery route
  let priorityStores: number[] = [];

  if (deliveryDate) {
    const dayOfWeek = deliveryDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    console.log(`Delivery date: ${deliveryDate.toISOString()}, Day: ${dayOfWeek}`);

    const route = await prisma.deliveryRoute.findFirst({
      where: { dayOfWeek, isActive: true },
    });

    if (route) {
      priorityStores = route.stores.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      console.log(`Route found for day ${dayOfWeek}: stores [${priorityStores.join(', ')}]`);
    } else {
      console.log(`No route found for day ${dayOfWeek}`);
    }
  } else {
    console.log('No delivery date provided, distributing without route priority');
  }

  // STEP 1: Group by External ID
  const ordersMap = new Map<string, OrderGroup>();

  for (const item of orders) {
    if (!ordersMap.has(item.externalId)) {
      ordersMap.set(item.externalId, {
        externalId: item.externalId,
        orderName: item.orderName,
        customerName: item.customerName,
        shippingAddress: item.shippingAddress,
        shippingCity: item.shippingCity,
        orderDate: item.orderDate,
        items: [],
        totalItemsCount: 0,
      });
    }

    const order = ordersMap.get(item.externalId)!;

    // Parse available stores from Inventory
    const availableStores = parseInventory(item.inventory);

    order.items.push({
      sku: item.sku,
      productName: item.productName,
      quantity: item.quantity,
      availableStores: availableStores,
      locationCode: item.location,
    });

    order.totalItemsCount += item.quantity;
  }

  const groupedOrders = Array.from(ordersMap.values());
  
  // STEP 2: Sort by priority
  groupedOrders.sort((a, b) => {
    // Level 1: More items = higher priority
    if (b.totalItemsCount !== a.totalItemsCount) {
      return b.totalItemsCount - a.totalItemsCount;
    }
    // Level 2: Earlier date = higher priority
    return a.orderDate.getTime() - b.orderDate.getTime();
  });

  // STEP 3: Distribute items
  const results: DistributionResults = {
    mainWarehouse: [],
    storeRequests: [],
    insufficient: [],
  };

  const storeRequestsMap = new Map<number, DistributionResults['storeRequests'][0]>();

  let globalRouteIndex = 0;

  // Track which SKU we already took from which store
  const skuStoreUsage = new Map<string, Set<number>>();

  for (const order of groupedOrders) {
    for (const item of order.items) {

      // Check main warehouses
      const mainStores = item.availableStores.filter(s =>
        MAIN_WAREHOUSES.includes(s)
      );

      if (mainStores.length > 0) {
        // Available in main warehouse
        results.mainWarehouse.push({
          orderId: order.externalId,
          sku: item.sku,
          productName: item.productName,
          quantity: item.quantity,
          status: 'main_warehouse',
          warehouse: mainStores[0],
          locationCode: item.locationCode,
          availableStores: item.availableStores,
        });

        continue;
      }

      // Not in main warehouse - distribute to stores
      const otherStores = item.availableStores.filter(s =>
        !MAIN_WAREHOUSES.includes(s) && !excludedStores.includes(s)
      );

      let remainingQty = item.quantity;
      const allocations: StoreAllocation[] = [];

      // STEP 3A: Prioritize route stores (if route exists)
      if (priorityStores.length > 0) {
        const routeStores = otherStores.filter(s => priorityStores.includes(s));

        while (remainingQty > 0 && routeStores.length > 0) {
          const storeId = routeStores[globalRouteIndex % routeStores.length];

          // Check if we already used this store for this SKU
          const usageKey = item.sku;
          if (!skuStoreUsage.has(usageKey)) {
            skuStoreUsage.set(usageKey, new Set());
          }

          const usedStores = skuStoreUsage.get(usageKey)!;

          // If this store was already used for this SKU, skip it
          if (usedStores.has(storeId)) {
            globalRouteIndex++;

            // Check if we've tried all stores
            if (usedStores.size >= routeStores.length) {
                break;
            }

            continue;
          }

          // Mark this store as used for this SKU
          usedStores.add(storeId);

          // Add to store requests map
          if (!storeRequestsMap.has(storeId)) {
            storeRequestsMap.set(storeId, {
              storeId,
              storeName: `Store ${storeId}`,
              managerPhone: undefined,
              items: [],
              messageText: '',
            });
          }

          storeRequestsMap.get(storeId)!.items.push({
            orderId: order.externalId,
            sku: item.sku,
            productName: item.productName,
            quantity: 1,
            availableStores: item.availableStores,
          });

          allocations.push({
            storeId,
            quantity: 1,
          });

          remainingQty--;
          globalRouteIndex++;
        }

      }

      // STEP 3B: Distribute remaining to other stores (with round-robin)
      if (remainingQty > 0) {
        const nonRouteStores = otherStores.filter(s => !priorityStores.includes(s));

        while (remainingQty > 0 && nonRouteStores.length > 0) {
          const storeId = nonRouteStores[globalRouteIndex % nonRouteStores.length];

          // Check if we already used this store for this SKU
          const usageKey = item.sku;
          if (!skuStoreUsage.has(usageKey)) {
            skuStoreUsage.set(usageKey, new Set());
          }

          const usedStores = skuStoreUsage.get(usageKey)!;

          // If this store was already used for this SKU, skip it
          if (usedStores.has(storeId)) {
            globalRouteIndex++;

            // Check if we've tried all stores
            if (usedStores.size >= nonRouteStores.length) {
              break;
            }

            continue;
          }

          // Mark this store as used for this SKU
          usedStores.add(storeId);

          // Add to store requests map
          if (!storeRequestsMap.has(storeId)) {
            storeRequestsMap.set(storeId, {
              storeId,
              storeName: `Store ${storeId}`,
              managerPhone: undefined,
              items: [],
              messageText: '',
            });
          }

          storeRequestsMap.get(storeId)!.items.push({
            orderId: order.externalId,
            sku: item.sku,
            productName: item.productName,
            quantity: 1,
            availableStores: item.availableStores,
          });

          allocations.push({
            storeId,
            quantity: 1,
          });

          remainingQty--;
          globalRouteIndex++;
        }

        if (allocations.length > 0) {
        }
      }

        // STEP 3C: If not enough stores - mark as insufficient
        if (remainingQty > 0) {
          results.insufficient.push({
            orderId: order.externalId,
            sku: item.sku,
            productName: item.productName,
            quantity: item.quantity,
            status: 'insufficient',
            missingQuantity: remainingQty,
            availableStores: item.availableStores, 
          });
          
        }

      }
    }

  // STEP 4: Load store data from DB
  const storeIds = Array.from(storeRequestsMap.keys());

  if (storeIds.length > 0) {
    const stores = await prisma.store.findMany({
      where: {
        id: { in: storeIds }
      },
      select: {
        id: true,
        name: true,
        managerPhone: true,
      }
    });

    // Update names and phones
    for (const store of stores) {
      const request = storeRequestsMap.get(store.id);
      if (request) {
        request.storeName = store.name;
        request.managerPhone = store.managerPhone || undefined;
      }
    }
  }

  // STEP 5: Generate messages for stores
  const storeRequestsArray: DistributionResults['storeRequests'] = [];

  for (const [storeId, request] of storeRequestsMap) {
    request.messageText = generateMessage(request);
    storeRequestsArray.push(request);
  }

  // Sort by store ID
  storeRequestsArray.sort((a, b) => a.storeId - b.storeId);

  console.log('Distribution completed!');
  console.log(`Main warehouse: ${results.mainWarehouse.length}`);
  console.log(`Store requests: ${storeRequestsArray.length} stores`);
  console.log(`Insufficient: ${results.insufficient.length}`);

  return {
    mainWarehouse: results.mainWarehouse,
    storeRequests: storeRequestsArray,
    insufficient: results.insufficient,
  };
};