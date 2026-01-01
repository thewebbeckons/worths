# Worthie

A modern, privacy-focused net worth tracking desktop application built with [Tauri](https://tauri.app), Nuxt 4, and Nuxt UI. All data is stored locally on your device using IndexedDB.

![Worthie Dashboard](./worthie_dashboard.png)

## Features

- **🖥️ Desktop App**: Native desktop application powered by **Tauri** for macOS, Windows, and Linux.
- **📊 Visual Insights**: Track your net worth over time with dynamic area charts.
- **🏦 Account Management**: Manage multiple accounts with categories (TFSA, RRSP, Cash, Loan, etc.) and owner assignments.
- **🔄 Balance Updates**: Easily update account balances and maintain a historical record of your financial progress.
- **🔒 Private & Local**: Your data never leaves your device. Powered by **Dexie.js** and **IndexedDB**.
- **🎨 Modern UI**: Clean, responsive interface built with **Nuxt UI v4**.

## Tech Stack

- **Desktop Runtime**: [Tauri 2](https://tauri.app)
- **Framework**: [Nuxt 4](https://nuxt.com)
- **UI Components**: [Nuxt UI v4](https://ui.nuxt.com)
- **Database**: [Dexie.js](https://dexie.org) (IndexedDB)
- **Charts**: [Nuxt Charts](https://github.com/wobsoriano/nuxt-charts)
- **Form Validation**: [Zod](https://zod.dev)
- **Utilities**: [VueUse](https://vueuse.org)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (Version 20 or higher recommended)
- [pnpm](https://pnpm.io)
- [Rust](https://www.rust-lang.org/tools/install) (required for Tauri)

### Installation

1. Clone the repository or download the source code.
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Start the Tauri development app with hot-reload:
```bash
pnpm tauri:dev
```

Or run the web frontend only (without the native wrapper):
```bash
pnpm dev
```

### Production

Build the desktop application for your platform:
```bash
pnpm tauri:build
```

The built application will be located in `src-tauri/target/release/bundle/`.

## Project Structure

- `app/components/`: Reusable Vue components (Charts, Forms, Lists).
- `app/composables/`: Shared logic for database access (`useDatabase`) and net worth calculations (`useNetWorth`).
- `app/pages/`: Application routing and main views.
- `app/types/`: TypeScript definitions and Zod schemas.
- `src-tauri/`: Tauri configuration and Rust backend.

## License

MIT
