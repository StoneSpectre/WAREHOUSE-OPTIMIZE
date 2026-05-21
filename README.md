# Pan-India Logistics Optimization Dashboard 

This repository contains a full-stack, enterprise-grade Decision Support System (DSS) for optimizing supply chain networks across India. It solves a **Capacitated Facility Location Problem (CFLP)** to determine the optimal subset of warehouses to open, minimizing both fixed operational costs and variable transportation costs while strictly respecting physical capacity constraints at each hub.

##  Key Features

* **Mathematical Optimization Engine:** Uses Mixed-Integer Linear Programming (MILP) to solve the NP-Hard facility location problem, mathematically guaranteeing the lowest cost configuration.
* **Dynamic Stress-Testing (Sensitivity Analysis):** Features real-time Demand Surge and Fixed Cost slider controls, allowing supply chain managers to simulate market fluctuations (e.g., holiday peaks) and instantly see how the optimal warehouse strategy shifts.
* **Interactive Cartography:** Integrates Leaflet.js and Google Maps tile layers to provide high-fidelity visualization of physical supply chains, including dynamic dashed routing lines between active hubs and demand zones.
* **Dual-Axis Break-Even Analysis:** A real-time `Chart.js` analytical graph plotting fixed versus transport cost trade-offs across 255 different network permutations.
* **Branch & Bound Visualization:** An animated log panel that simulates the algorithmic exploration tree, demonstrating how sub-optimal supply chain branches are pruned based on lower bounds.

##  Technology Stack

### Backend
* **Python 3.13** - Core logic
* **Flask** - REST API server
* **PuLP & CBC Solver** - Operations Research / Mathematical optimization library for constraint modeling

### Frontend
* **HTML5 / CSS3** - Responsive, White SaaS enterprise design system
* **Vanilla JavaScript (ES6)** - State management and asynchronous API polling
* **Leaflet.js** - Interactive mapping engine
* **Chart.js** - Data visualization

## 📐 Mathematical Formulation (CFLP)

The backend rigorously enforces the following constraints:

**Minimize:**
```text
Z = Σ (Fixed_Cost_w * y_w) + Σ (Transport_Cost_zw * x_zw)
```
**Subject to:**
1. **Demand Satisfaction:** `Σ x_zw = Demand_z` (for all zones `z`)
2. **Capacity Limits:** `Σ x_zw <= Capacity_w * y_w` (for all warehouses `w`)
3. **Binary Assignment:** `y_w ∈ {0, 1}` (Warehouse is either open or closed)
4. **Non-Negativity:** `x_zw >= 0` (Flow cannot be negative)

##  How to Run Locally

1. **Prerequisites:** Ensure you have Python installed on your machine.
2. **Install Dependencies:**
   ```bash
   pip install flask pulp
   ```
3. **Start the Server:**
   Navigate into the project directory and run:
   ```bash
   python app.py
   ```
4. **View the Dashboard:**
   Open your web browser and navigate to:
   `http://127.0.0.1:5001`

##  Project Structure

* `app.py`: Flask application and API routing.
* `solver.py`: The core algorithmic engine using PuLP to execute the transport simplex and Branch & Bound logic.
* `data.js`: Geolocation, capacity limits, and hardcoded distance matrices.
* `script.js`: Frontend architecture, UI rendering, Chart.js logic, and API calls.
* `style.css`: The enterprise design system and layout.
* `index.html`: The semantic structure of the dashboard.
