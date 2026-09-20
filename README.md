# 🚀 Innovation Portfolio Management

An interactive dashboard application built with **React 19**, **Refine**, **Ant Design**, and **Vite** to track and visualize innovation project lifecycles across **Strategic Direction**, **Development**, **Test/Implement**, and **Launch** stages.

---

## 🌟 Features

- **Multi-Source Data Filtering**: Switch seamlessly between **Top-Down** and **Bottom-Up** initiatives or view all projects combined.
- **Status Pipeline Tracking**: Real-time project counts grouped into *In Progress*, *Done*, and *Rejected*.
- **Interactive Visualizations**: Stage breakdown by portfolio and category powered by Recharts.
- **Deep-linking & Preserved State**: Year, portfolio, category, and source filters persist in the URL for shareable views.
- **Dark Mode UI**: Clean dark theme customized with Ant Design.
- **CSV-backed Data Provider**: Automated CSV parsing for bottom-up and top-down project datasets.

---

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Data & Framework Layer**: [Refine](https://refine.dev/)
- **UI Components**: [Ant Design 5](https://ant.design/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Linter**: [Oxlint](https://oxc.rs/)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18+` (or `v20+` recommended)
- **npm** (or `pnpm` / `yarn`)

### 1. Clone the repository

```bash
git clone <repository-url>
cd innovation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

The application will start with HMR (Hot Module Replacement) and be available at:
👉 **`http://localhost:5173`** (or the port Vite outputs in your console).

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite local development server with HMR. |
| `npm run build` | Runs TypeScript compilation (`tsc -b`) and bundles production assets with Vite. |
| `npm run preview` | Locally serves the generated production bundle (`dist/`) for verification. |
| `npm run lint` | Runs fast code quality checks using [Oxlint](https://oxc.rs/). |

---

## 📁 Project Structure

```text
innovation/
├── public/
│   └── data/                    # CSV datasets consumed by csvDataProvider
│       ├── topdown-innovation.csv
│       └── bottom-up-innovation.csv
├── src/
│   ├── pages/
│   │   ├── dashboard/           # Main summary dashboard & charts
│   │   └── status/              # Detailed status drill-down table
│   ├── providers/
│   │   └── csvDataProvider.ts   # Custom Refine data provider reading local CSVs
│   ├── types/
│   │   └── index.ts             # Innovation interfaces & color definitions
│   ├── App.tsx                  # Ant Design dark theme, Refine & Router setup
│   └── main.tsx                 # Entrypoint
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📊 Data Management

Project data is read directly from CSV files placed under `public/data/`:
- `public/data/topdown-innovation.csv`
- `public/data/bottom-up-innovation.csv`

When adding or updating records in these CSVs, ensure columns match the structure defined in `src/types/index.ts`.
