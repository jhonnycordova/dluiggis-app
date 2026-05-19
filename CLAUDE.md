# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **D'Luigis Pizzería & Delivery**, a Next.js order management system for tracking orders from multiple delivery platforms (Uber, PedidosYa, WhatsApp) and managing business expenses. The app is built with Next.js 16 (App Router), React 19, TypeScript, and Supabase as the backend database.

## Development Commands

```bash
# Development server (with Turbopack)
npm run dev

# Production build
npm run build

# Production server
npm start

# Linting
npm run lint
```

The dev server runs on http://localhost:3000 with Turbopack enabled for faster builds.

## Architecture

### Core Structure

- **src/app/** - Next.js App Router pages (file-based routing)
  - `/` - Home page with navigation menu
  - `/registrar-pedido` - Order registration form
  - `/registrar-gasto` - Expense registration form
  - `/historial-pedidos` - Order history view
  - `/utilidades` - Utilities/profits dashboard with analytics charts

- **src/services/** - Data layer services for Supabase operations
  - `orders.ts` - CRUD operations for orders (table: `pedidos`)
  - `expenses.ts` - CRUD operations for expenses (table: `gastos`)

- **src/lib/** - Shared configuration
  - `supabase.ts` - Supabase client singleton initialization

- **src/types/** - TypeScript type definitions
  - `index.ts` - Core types: `Order`, `Expense`, `DatabaseOrder`, `DatabaseExpense`

- **src/utils/** - Utility functions
  - `calculations.ts` - Commission calculations, net amount calculations, number formatting

### Database Schema (Supabase)

**Table: pedidos**
- id (string)
- fecha (timestamp)
- plataforma ('uber' | 'pedidosya' | 'whatsapp')
- referencia (string, optional)
- monto (number)
- comision (number, optional)
- monto_neto (number, optional)
- metodo_pago (string, optional)
- persona_entrega (string, optional)
- tipo_tarjeta ('debito' | 'credito', optional)
- pagado_efectivo (boolean, optional)

**Table: gastos**
- id (string)
- fecha (timestamp)
- tipo ('salario' | 'insumos' | 'otros')
- concepto (string)
- monto (number)

### Service Layer Pattern

All Supabase interactions go through service modules that export an object with async methods:

```typescript
export const ordersService = {
  async create(order: Omit<DatabaseOrder, 'id'>): Promise<Order>
  async getAll(): Promise<Order[]>
  async getByDate(date: string): Promise<Order[]>
  async getByMonth(year: number, month: number): Promise<Order[]>
  async update(id: string, data: Partial<Omit<Order, 'id'>>): Promise<Order>
  async delete(id: string): Promise<void>
}
```

Services use the shared `supabase` client from `@/lib/supabase` and throw errors on failure (no error wrapping).

### Commission Calculation Rules

Implemented in `src/utils/calculations.ts`:
- **Uber/PedidosYa**: 36% commission on all orders
- **WhatsApp (tarjeta crédito)**: 4% commission
- **WhatsApp (tarjeta débito or unspecified card)**: 2% commission
- **WhatsApp (cash/other)**: 0% commission
- **Delivery deduction**: when `persona_entrega = 'josue'`, subtract 2000 from `monto_neto`

### Path Aliases

TypeScript is configured with `@/*` mapping to `src/*` for cleaner imports.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Key Technologies

- **Next.js 16** with App Router and Turbopack
- **React 19** with client-side state management (useState, useEffect)
- **Supabase** for PostgreSQL database and real-time capabilities
- **Recharts** for data visualization in the utilities dashboard
- **TypeScript** with strict mode enabled
- **Geist fonts** (Sans and Mono) from Vercel

## Styling

- CSS Modules (`.module.css`) for component-specific styles
- Global styles in `src/app/globals.css`
- Mobile-first responsive design (viewport locked: user-scalable=no)
- Spanish locale for number formatting
