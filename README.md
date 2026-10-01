# Atlas — Spatial Real Estate Intelligence & Commercial Platform

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r185-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment%20Gateway-0C2340?logo=razorpay&logoColor=white)](https://razorpay.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Atlas** is an institutional-grade, interactive geospatial real estate intelligence platform designed for commercial brokers, institutional funds, and private wealth advisory offices. Combining WebGL/Three.js 3D spatial visualization with live property feeds, commercial deal room workspaces, and automated subscription monetization.

---

## 🌟 Key Highlights

### 1. 🌐 Interactive 3D Geospatial Globe
* **Real-Time WebGL Globe**: Custom spherical shader projection with dynamic day/night atmospheric glow, real-time rotation, and interactive drag/zoom controls.
* **Geospatial Intelligence**: Visualized regional clusters, city-tier nodes, and coordinates with smooth camera transitions and contextual property pins.
* **Filter & Analytics Engine**: Instant filtering across global asset classes, price tiers, cap rates, square footage, and regional markets.

### 2. 🏛️ 3D Spatial Property & Immersion Rotunda
* **Procedural 3D Massing Models**: Interactive volumetric building previews rendered directly inside React Three Fiber, complete with architectural floorplate dissection, orientation grids, and shadow casting.
* **Photo Immersion Rotunda**: Curved 360° cylindrical panoramic viewer transforming standard architectural photography into immersive walkthroughs.
* **Presentation Mode**: Fullscreen, clutter-free showcase mode tailored for client pitches, board meetings, and high-stakes investor reviews.

### 3. 💼 Commercial Operations & Broker Workspace
* **Dealer Dashboard**: Complete broker command center featuring listing portfolio management, inquiry pipeline stages, and conversion analytics.
* **Admin Lead Desk**: Centralized lead triage, priority scoring, dealer assignment, and SLA tracking with audit logs.
* **Agency Storefronts**: Customizable white-label landing pages for affiliated partner brokerages (`/agency/:slug`) showing verified inventory and licensed agent rosters.
* **Private Client Portals**: Secure access suites protected by VIP access codes and encrypted inquiry channels for ultra-high-net-worth (UHNW) off-market portfolios.

### 4. 💳 Built-in Commercial Billing & Subscriptions
* **Integrated Razorpay Gateway**: Serverless order creation, client-side checkout modal, and HMAC SHA-256 signature verification.
* **Multi-Tier SaaS Engine**:
  * **Broker Pro**: For solo commercial brokers pitching flagship assets ($299/mo or ₹24,999/mo).
  * **Agency Growth**: For growing commercial brokerages & boutique advisory teams ($1,499/mo or ₹1,24,999/mo).
  * **Enterprise White-Label**: Custom domains, zero Atlas branding, and unlimited deal rooms ($4,997/mo or ₹4,15,000/mo).

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Core** | React 19, TypeScript, React Router 7, Vite |
| **3D & Spatial** | Three.js (r185), `@react-three/fiber`, `@react-three/drei` |
| **UI & Motion** | Tailwind CSS v4, Framer Motion, Lucide Icons, Lenis Smooth Scroll |
| **Database & Auth** | Supabase (PostgreSQL, Row-Level Security, Realtime Subscriptions) |
| **Serverless API** | Vercel Serverless Functions (`/api/*`), Node.js runtime |
| **CRE Data Feed** | Untera Real Estate API with secure server-side proxy & 15-min in-memory caching |
| **Payments** | Razorpay SDK & Webhooks with cryptographic signature verification |
| **Zero-Cost Hosting** | Vercel (Frontend & Serverless Edge) + Supabase (Postgres & Auth) |

---

## 📁 Repository Structure

```plaintext
Atlas/
├── api/                     # Serverless backend functions (Vercel)
│   ├── media/               # External CDN media validation & probe
│   ├── razorpay/            # Order creation, payment verification & webhooks
│   └── untera/              # Secure Untera real estate API gateway & cache
├── public/                  # Static textures, 3D assets, and media
├── src/
│   ├── app/                 # Root application wrapper & router setup
│   ├── components/
│   │   ├── common/          # Reusable UI primitives (buttons, modals, badges)
│   │   ├── dealer/          # Dealer workspace & billing upgrade modal
│   │   ├── globe/           # Three.js 3D interactive globe canvas & shaders
│   │   ├── layout/          # Header, navigation, footer, and frame wrappers
│   │   └── property/        # Property cards, filters, and spatial experiences
│   │       └── spatial/     # 3D massing scenes, rotunda, and geometry math
│   ├── hooks/               # Custom hooks for auth, media queries, and data
│   ├── pages/               # Route views (Globe, Markets, Dealer, Private Client, etc.)
│   ├── services/            # Supabase, Untera, Razorpay, and Geo services
│   ├── styles/              # Global styling & Tailwind v4 theme variables
│   └── types/               # TypeScript interface and type declarations
├── supabase/
│   └── migrations/          # Structured SQL schema, RLS policies, and triggers
├── .env.example             # Template for required environment variables
├── vercel.json              # Vercel routing rules & API rewrites
└── vite.config.ts           # Vite bundler, local dev proxy, and build settings
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **Package Manager**: npm, yarn, or pnpm
* **Supabase Account**: Free Tier (optional for local mock data)
* **Untera API Key**: Free Tier at [untera.io](https://untera.io)
* **Razorpay Account**: Standard test/live keys at [razorpay.com](https://razorpay.com)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Harmit2101/Atlas.git
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
   Open `.env.local` and populate your credentials:
   ```ini
   # Untera Real Estate API (Free Tier: 1,000 req/day)
   UNTERA_API_KEY=your_untera_api_key_here

   # Supabase Free Tier Configuration
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

   # Razorpay Payment Gateway
   VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
   RAZORPAY_KEY_ID=rzp_test_your_key_id_here
   RAZORPAY_KEY_SECRET=your_razorpay_secret_here
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
   ```

4. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser. The Vite dev server includes built-in proxy middleware emulating the production serverless API endpoints.

5. **Production Build & Verification**:
   ```bash
   npm run build
   ```

---

## 🌐 Deployment to Vercel (Zero-Cost Architecture)

Atlas requires **no separate backend server** (no EC2, no VPS, no Docker container). Both the React SPA frontend and the Node.js serverless API routes deploy together on Vercel:

1. **Connect GitHub Repository**: Import the repository on [Vercel](https://vercel.com/new).
2. **Build Configuration**:
   * **Framework Preset**: Vite
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. **Environment Variables**: Add the variables from `.env.local` into **Vercel Project Settings > Environment Variables**.
4. **Custom Domain**: Under **Project Settings > Domains**, bind your custom domain (e.g. `atlas.yourdomain.com`). SSL certificates are automatically provisioned.

---

## 🔒 Security & Best Practices

* **API Proxy Shielding**: Third-party external API requests (Untera, Razorpay) are strictly handled through serverless proxy handlers (`/api/*`), preventing private keys from leaking into client-side JS bundles.
* **Cryptographic Signature Verification**: Razorpay payments verify HMAC SHA-256 signatures server-side before activating subscriptions.
* **Row-Level Security (RLS)**: PostgreSQL tables in Supabase enforce granular RLS policies, isolating dealer leads and private client memorandums.
* **Zero Secret Leakage**: All `.env`, `.env.local`, and credential files are strictly ignored by `.gitignore`.

---

## 📜 License

This project is distributed under the [MIT License](LICENSE).
