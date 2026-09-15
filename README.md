# Atlas — Spatial Real Estate Intelligence & Commercial Platform

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r185-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Atlas** is an ultra-modern, interactive geospatial real estate intelligence platform designed for commercial brokers, institutional investors, and private client offices. Combining WebGL/Three.js 3D spatial visualization with live property feeds, enterprise dealer operations, and private wealth discovery portals.

---

## 🌟 Key Highlights

### 1. 🌐 Interactive 3D Geospatial Globe
* **Real-Time WebGL Globe**: Custom spherical shader projection with dynamic day/night atmospheric glow, real-time rotation, and interactive drag/zoom controls.
* **Geospatial Intelligence**: Visualized regional clusters, city-tier nodes, and coordinates with smooth camera transitions and contextual property pins.
* **Filter & Analytics Engine**: Instant filtering across global asset classes, price tiers, cap rates, and square footage.

### 2. 🏛️ 3D Spatial Property & Immersion Rotunda
* **Procedural 3D Massing Models**: Interactive volumetric building previews rendered directly inside React Three Fiber, complete with architectural floorplate dissection, orientation grids, and shadow casting.
* **Photo Immersion Rotunda**: Curved 360° cylindrical panoramic viewer transforming standard architectural photography into immersive walkthroughs.
* **Presentation Mode**: Fullscreen, clutter-free showcase mode tailored for client pitches, board meetings, and high-stakes investor reviews.

### 3. 💼 Commercial Operations & Broker Workspace
* **Dealer Dashboard**: Complete broker command center featuring listing portfolio management, inquiry pipeline stages, and conversion analytics.
* **Admin Lead Desk**: Centralized lead triage, priority scoring, dealer assignment, and SLA tracking with audit logs.
* **Agency Storefronts**: Customizable white-label landing pages for affiliated partner brokerages (`/agency/:slug`) showing verified inventory and licensed agent rosters.
* **Private Client Portals**: Secure access suites protected by VIP access codes and encrypted inquiry channels for ultra-high-net-worth (UHNW) off-market portfolios.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Core** | React 19, TypeScript, React Router 7 |
| **3D & Spatial** | Three.js, `@react-three/fiber`, `@react-three/drei` |
| **UI & Motion** | Tailwind CSS v4, Framer Motion, Lucide Icons, Lenis Smooth Scroll |
| **Data & Auth** | Supabase (PostgreSQL, Row-Level Security, Realtime Subscriptions) |
| **API Integration** | Untera Real Estate API with secure server-side proxy |
| **Build & Tooling** | Vite, PostCSS, ESLint, TypeScript Strict Mode |

---

## 📁 Repository Structure

```plaintext
Atlas/
├── api/                     # Serverless endpoints & secure API proxies
│   └── untera/              # Untera real estate API secure gateway
├── public/                  # Static media, textures, and assets
├── src/
│   ├── app/                 # Root application wrapper & router setup
│   ├── components/
│   │   ├── common/          # Reusable UI primitives (buttons, modals, badges)
│   │   ├── globe/           # Three.js 3D interactive globe canvas & shaders
│   │   ├── layout/          # Header, navigation, footer, and frame wrappers
│   │   └── property/        # Property cards, filters, and spatial experiences
│   │       └── spatial/     # 3D massing scenes, rotunda, and geometry math
│   ├── hooks/               # Custom hooks for auth, media queries, and queries
│   ├── pages/               # Route views (Globe, Markets, Dealer, Private Client, etc.)
│   ├── services/            # Supabase clients, commercial APIs, and data mappers
│   ├── styles/              # Global styling & Tailwind v4 theme variables
│   └── types/               # TypeScript interface and type declarations
├── supabase/
│   └── migrations/          # Structured SQL schema, RLS policies, and triggers
├── .env.example             # Template for required environment variables
└── vite.config.ts           # Vite bundler, path aliases, and local proxy setup
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **Package Manager**: npm, yarn, or pnpm
* **Supabase Project**: Free tier or self-hosted instance (optional for local mock data)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/Atlas.git
   cd Atlas
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the sample environment file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and configure your credentials:
   ```ini
   # Server-side proxy API keys (never exposed to client bundle)
   UNTERA_API_KEY=your_untera_api_key_here

   # Client-side Supabase keys
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Initialize Database (Optional)**:
   Apply the SQL migration files located in `supabase/migrations/` via the Supabase Dashboard SQL Editor or Supabase CLI.

5. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:5173` in your browser.

6. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Best Practices

* **API Proxy Shielding**: Third-party external API requests (e.g., Untera) are routed through serverless proxy handlers (`/api/untera/*`), keeping upstream secret keys off the client-facing bundle.
* **Row-Level Security (RLS)**: Database tables are protected by granular Postgres RLS policies, separating institutional dealer records from public listings.
* **Zero Secret Leakage**: Environment variables containing private keys are excluded from git tracking via `.gitignore`. Always maintain secret keys within deployment dashboards (e.g. Vercel, Netlify) or secure vault systems.

---

## 📜 License

This project is distributed under the [MIT License](LICENSE).
