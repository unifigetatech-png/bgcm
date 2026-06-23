# Burleigh Gold Coast Motel (BGCM) — Responsive Layout & Optimization Engine

This repository tracks the production-grade frontend architecture, automated design token systems, and asset optimization pipelines for the Burleigh Gold Coast Motel web application.

---

## 🚀 The Terminal Automation Toolkit

Our local environment uses standalone build utilities to handle asset scaling, cache synchronization, and accessibility auditing natively. Run these commands from the project root before deployment:

### 1. Build and Crop Image Asset Ladders
Processes raw source photographs, resizes them across layout-bound content constraints, crops them to strict aspect ratios (16:9, 4:3, 3:2, 21:9), and outputs optimized formats:
```bash
npm run build:images
```
*   **Outputs**: WebP (Quality: 75), AVIF (Quality: 55), and fallback JPEGs under `/images/`.

### 2. Standardize Semantic Accessibility Layout Landmarks
Scans all 64 templates to enforce correct page landmarks, sequential header lists (`<h1>` through `<h6>`), and strict keyboard focus order:
```bash
node scripts/migrate-a11y-semantics.mjs
```

### 3. Enforce Global CSS Production Cache-Busting
Synchronizes all style tags across your deployment trees, automatically shifting global versions to immediately push hot updates past browser caching walls:
```bash
node scripts/sync-css-versions.mjs
```

---

## 🛠️ Unified Layout System Overview
*   **Desktop Container Boundary**: `--container-max: 1100px;` with symmetric `20px` inner gutters.
*   **Mobile Mobile Rhythm (≤680px)**: Components flip to columns natively while card grids utilize an absolute, full-viewport edge-peek carousel track.
*   **CLS Elimination Matrix**: All images are bound to layout parents containing native `aspect-ratio` resets, forcing fallback markup widths (`width="" height=""`) to reserve exact loading boxes on page load.
