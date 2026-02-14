import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding stores...");

  // Main stores
  const mainWarehouses = [
    { id: 1, name: 'First warehouse', isMainWarehouse: true },
    { id: 69, name: 'Footwear and accessories warehouse', isMainWarehouse: true },
    { id: 70, name: 'Warehouse outlet', isMainWarehouse: true },
    { id: 79, name: 'Footwear and accessories warehouse - outlet', isMainWarehouse: true },
  ];

  // Stores
  const stores = [
    { id: 2, name: 'Herzliya', city: 'Herzliya' },
    { id: 5, name: 'Givatayim', city: 'Givatayim' },
    { id: 6, name: 'Netanya', city: 'Netanya' },
    { id: 7, name: 'Raanana', city: 'Raanana' },
    { id: 10, name: 'Mamila', city: 'Jerusalem' },
    { id: 11, name: 'Modein', city: 'Modein' },
    { id: 12, name: 'Rehovot', city: 'Rehovot' },
    { id: 14, name: 'Haifa', city: 'Haifa' },
    { id: 16, name: 'Petah Tikva', city: 'Petah Tikva' },
    { id: 20, name: 'Limited', city: 'Tel Aviv' },
    { id: 21, name: 'Ashdod', city: 'Ashdod' },
    { id: 22, name: 'Zichron Yakov', city: 'Zichron Yakov' },
    { id: 23, name: 'TLV', city: 'Tel Aviv' },
    { id: 24, name: 'Ayalon', city: 'Ramat Gan' },
    { id: 25, name: 'Zaav', city: 'Rishon LeZion' },
    { id: 26, name: 'Ramat Aviv', city: 'Ramat Aviv' },
    { id: 27, name: 'Kvar saba', city: 'Kvar saba' },
    { id: 60, name: 'Eilat', city: 'Eilat' },
    { id: 71, name: 'Tel Giborim', city: 'Tel Aviv' },
    { id: 72, name: 'Chutzot amifrats', city: 'Haifa' },
  ];

  // Delivery routes
  const deliveryRoutes = [
    { dayOfWeek: 0, stores: '23, 20, 26, 2, 27, 16, 24, 5, 11, 10, 12, 21, 25' }, // Sunday
    { dayOfWeek: 1, stores: '26, 7, 6, 22, 14, 72' }, // Monday
    { dayOfWeek: 2, stores: '23, 20, 26, 2, 11, 21, 25' }, // Tuesday
    { dayOfWeek: 3, stores: '26, 24, 16, 5, 10, 12' }, // Wednesday
    { dayOfWeek: 4, stores: '23, 20, 26, 2, 7, 27, 6, 11, 21, 25' }, // Thursday
  ];

  // Create main warehouses
  console.log('Creating main warehouses...');
  for (const warehouse of mainWarehouses) {
    await prisma.store.upsert({
      where: { id: warehouse.id },
      update: warehouse,
      create: warehouse,
    });
    console.log(`Created warehouse ${warehouse.id}`);
  }

  console.log('Creating stores...');
  for (const store of stores) {  // 'store' is singular!
    await prisma.store.upsert({
      where: { id: store.id },     // Use 'store', not 'stores'
      update: store,                // Use 'store', not 'stores'
      create: {
        ...store,
        isMainWarehouse: false,
      },
    });
    console.log(`Created store ${store.id}`);
  }

 console.log('Creating delivery routes...');
 for (const route of deliveryRoutes) {
  await prisma.deliveryRoute.upsert({
    where: { id: route.dayOfWeek + 1 },
    update: route,
    create: {
      ...route,
      isActive: true,
    },
  });
  console.log(`Created route for day ${route.dayOfWeek}`);
  
 }

  console.log('Seed completed successfully!');


}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });