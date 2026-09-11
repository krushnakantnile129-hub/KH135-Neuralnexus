# 🌿 SAVE-BITE
**Hyper-Local Food Surplus Decision-Support Platform & Zero-Checkout Marketplace**

SAVE-BITE is designed to resolve terminal perishable food loss in retail gastronomy (bakeries, cafés, restaurants, canteens). Unlike conventional commercial marketplaces, SAVE-BITE eliminates digital carts, payment escrows, and delivery dispatch complexities. Instead, it provides merchants with an explainable, human-in-the-loop pricing engine and publishes proximity-ranked deals directly to local foot traffic for offline point-of-sale redemption.

---

## 🚀 Key Features

- **Explainable Waste Risk Engine**: Deterministic multi-factor scoring model ($0-100$) evaluating Time Urgency ($40\%$), Volume Overhang ($35\%$), Footfall Velocity ($25\%$), and Price Elasticity Credit.
- **60 FPS Interactive Price Slider**: Real-time margin and sell-through probability simulation with strict $20\%$ recovery floor guardrails.
- **Zero-Checkout Discovery Feed**: Proximity search within $5\text{ km}$ radial bounds via the Haversine formula, live countdown timers, and direct turn-by-turn navigation handoff to Google Maps and Apple Maps.
- **Merchant ESG & Financial Telemetry**: Live metrics for Revenue Recovered (₹), Landfill Diversion (kg), Avoided $\text{CO}_2\text{e}$ (kg), and Rescue Conversion Ratio (%).
- **Standalone `index.html`**: A fully self-contained single file that runs in any browser with zero server setup.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (React 19 / TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide Icons
- **Geospatial Engine**: Haversine Distance & OS Intent Launchers

---

## 📦 Getting Started

### 1. Run with Node.js
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 2. Standalone Browser Version
Double-click `index.html` in your file explorer to run the entire app offline without Node.js!