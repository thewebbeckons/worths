# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Worthie is a privacy-focused net worth tracking PWA built with Nuxt 4. All data is stored locally in the browser using IndexedDB via Dexie.js. The app runs entirely client-side (`ssr: false`).

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server with hot-reload
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript type checking
```

## Architecture

### Data Layer

The app uses a two-tier composable architecture for data access:

1. **`app/plugins/db.client.ts`** - Dexie database singleton and low-level operations
   - Defines the `NetWorthDatabase` class with schema versions
   - Exports `getDb()` for accessing the database singleton
   - Exports `generateAllSnapshots()` for recalculating monthly aggregates
   - All database operations are client-only (guarded with `import.meta.server`)

2. **`app/composables/useDatabase.ts`** - Reactive database wrapper
   - Provides reactive state: `accounts`, `categories`, `profile`, `isReady`
   - Handles CRUD operations with automatic snapshot regeneration
   - Returns `AccountWithDetails` which enriches `DbAccount` with resolved category names and latest balances

3. **`app/composables/useNetWorth.ts`** - High-level financial calculations
   - Primary API for UI components
   - Computed values: `currentNetWorth`, `totalAssets`, `totalLiabilities`, `monthlyGrowth`
   - Methods for filtering/grouping: `getAccountsGroupedByCategory()`, `getAssetCategoryBreakdown`
   - Wraps database operations and auto-refreshes snapshots

### Database Schema

Defined in `app/types/db.ts`. Key tables:
- `accounts` - Financial accounts with `type: 'asset' | 'liability'` and `owner: 'me' | 'spouse' | 'joint'`
- `balances` - Historical balance entries (one per account per date)
- `categories` - Account categories with their own `type` field
- `monthlySnapshots` - Pre-calculated monthly aggregates (keyed by `yyyy-mm`)
- `profile` - User/spouse names and colors

### Component Structure

- `app/components/dashboard/` - Dashboard cards (NetWorthCard, AssetsListCard, LiabilitiesListCard)
- `app/pages/accounts/[id].vue` - Account detail page with balance history
- `app/pages/settings/` - Settings sub-pages (data export, danger zone, about)

### Key Patterns

- All database operations check `import.meta.server` and return early on server
- Account balances are stored as positive numbers; liabilities are subtracted in net worth calculations
- Snapshots are regenerated after any data mutation via `generateAllSnapshots()`
- Forms use Zod for validation
- UI components use Nuxt UI v4 (semantic color tokens like `primary`, `secondary`)
