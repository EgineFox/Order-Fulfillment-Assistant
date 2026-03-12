# Order Fulfillment Assistant

A full-stack web application for managing retail order distribution across a warehouse network. Upload an Excel order file, configure delivery parameters, and get a ready-to-use fulfillment plan with store-specific requests.

## What it does

1. Manager uploads an `.xlsx` order file from the e-commerce platform
2. Selects a delivery date and optionally excludes certain stores
3. The system runs a distribution algorithm:
   - Items available at **main warehouses** → picked directly
   - Items only available at **branch stores** → requests are generated for those stores, prioritized by the day's delivery route
   - Items with **no available stock** → flagged as insufficient
4. Results page shows a breakdown by category with ready-to-copy messages for store managers

## Tech stack

**Backend**
- Node.js + Express (TypeScript)
- Prisma ORM — PostgreSQL
- JWT authentication
- Multer — file uploads
- xlsx — Excel file parsing

**Frontend**
- React + TypeScript (Vite)
- React Router
- Axios

**Infrastructure**
- PostgreSQL (Render managed DB)
- Deployed on [Render](https://render.com)

## Distribution algorithm

Orders are grouped by External ID and sorted by priority:
1. More items in the order → higher priority
2. Earlier order date → higher priority

For each item:
- If stock exists at a main warehouse → assign to main warehouse
- Otherwise → distribute across branch stores using round-robin, prioritizing stores on the day's delivery route
- If quantity exceeds available store count → mark as insufficient

Store requests include a pre-formatted message text ready to send via WhatsApp.

## Database schema

| Table | Description |
|-------|-------------|
| `users` | Manager accounts with JWT auth |
| `stores` | Store directory (branches + main warehouses) |
| `file_uploads` | Upload history per user |
| `order_items` | Parsed rows from uploaded Excel files |
| `delivery_routes` | Per-weekday store priority lists |

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend
```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment variables

**Backend `.env`:**
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your_secret
PORT=3000
FRONTEND_URL=http://localhost:5173
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:3000
```

## Excel file format

The uploaded file must contain the following columns:

| Column | Required |
|--------|----------|
| External ID | yes |
| SKU | yes |
| Product Name | yes |
| Quantity | yes |
| Inventory | yes — comma-separated store IDs that have stock |
| Order Name | no |
| Customer Name | no |
| Shipping Address | no |
| Shipping City | no |
| Date | no |
| Location | no |
| Barcode | no |
