# Andhra Pradesh Police Commissionerate Map Dashboard

A modern, responsive, and interactive GIS dashboard for the Andhra Pradesh Police. This application provides a unified view of Commissionerates, Districts, and specialized units like Railway Police (GRP) with real-time map integration.

## 🚀 Features

-   **Interactive GIS Map**: Powered by OpenLayers with support for boundary overlays (Commissionerates, Districts, Stations).
-   **Responsive Design**: Seamless transition between desktop and mobile views.
    -   **Desktop**: Full-featured sidebar with hierarchical station listings.
    -   **Mobile**: Bottom navigation bar with touch-friendly tabs (Structure, Map, Search).
-   **Advanced Search**: Real-time filtering across all zones and Commissionerates.
-   **Command Structure Visualization**: Detailed information panels for each region, including commanding officer details and contact info.
-   **Drill-down Navigation**: Clicking on any sidebar card automatically zooms the map to that specific region.
-   **Theming**: Support for Dark Mode with synchronized map styling.
-   **GIS Tools**: Built-in tools for measuring distances, calculating areas, and drawing custom polygons.

## 📂 Project Structure

-   `index.html`: Main application entry point and UI logic.
-   `public/police-map-module.js`: Central GIS logic and map initialization.
-   `public/police-map-data.js`: Data adapters for fetching GeoJSON and service endpoints.
-   `public/police-map-styles.js`: Styling definitions for map features.
-   `public/ap-police-stations.json`: GeoJSON data for police station boundaries.
-   `backend/server.js`: Node.js/Express server (optional, for live DB integration).

## 🛠️ How to Use

### 1. Installation
Clone the repository and install dependencies (if using the provided backend):
```bash
npm install
```

### 2. Running Locally
Run the development server (using Vite or similar):
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Usage Tips
-   **Search**: Use the search bar in the header to find specific zones instantly.
-   **Filters**: Use the top chips (All, Commissionerates, etc.) to quickly category-filter the map view.
-   **Map Interaction**: Click on any map region to see details in a popup.
-   **Measure Tools**: Use the toolbar on the map to measure distances between stations.

## 🔧 Deployment & Production
To connect to a live OGC WMS/WFS server, modify the `serviceUrls` configuration in the `initPoliceBoundaryMap` call within `index.html`.

---
© 2026 Andhra Pradesh Police - Advanced Command & Control Center
