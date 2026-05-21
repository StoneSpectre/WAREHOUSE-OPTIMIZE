import math
import json

def haversine(lat1, lon1, lat2, lon2):
    R = 6371 # km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return int(R * c)

warehouses = {
  'W1': {'name': 'Bhiwandi', 'area': 'Mumbai Hub', 'coords': [19.296, 73.058], 'color': '#fbbf24'},
  'W2': {'name': 'Gurugram', 'area': 'NCR Hub', 'coords': [28.459, 76.980], 'color': '#34d399'},
  'W3': {'name': 'Hoskote', 'area': 'Bengaluru Hub', 'coords': [13.069, 77.798], 'color': '#a78bfa'},
  'W4': {'name': 'Sriperumbudur', 'area': 'Chennai Hub', 'coords': [12.971, 79.943], 'color': '#f472b6'},
  'W5': {'name': 'Sanand', 'area': 'Ahmedabad Hub', 'coords': [22.986, 72.380], 'color': '#38bdf8'},
  'W6': {'name': 'Dankuni', 'area': 'Kolkata Hub', 'coords': [22.678, 88.307], 'color': '#f87171'},
  'W7': {'name': 'Medchal', 'area': 'Hyderabad Hub', 'coords': [17.629, 78.482], 'color': '#c084fc'},
  'W8': {'name': 'Chakan', 'area': 'Pune Hub', 'coords': [18.750, 73.850], 'color': '#818cf8'}
}

zones = {
  'Z1': {'name': 'Delhi', 'coords': [28.613, 77.209]},
  'Z2': {'name': 'Mumbai', 'coords': [19.076, 72.877]},
  'Z3': {'name': 'Bengaluru', 'coords': [12.971, 77.594]},
  'Z4': {'name': 'Chennai', 'coords': [13.082, 80.270]},
  'Z5': {'name': 'Kolkata', 'coords': [22.572, 88.363]},
  'Z6': {'name': 'Hyderabad', 'coords': [17.385, 78.486]},
  'Z7': {'name': 'Pune', 'coords': [18.520, 73.856]},
  'Z8': {'name': 'Ahmedabad', 'coords': [23.022, 72.571]},
  'Z9': {'name': 'Jaipur', 'coords': [26.912, 75.787]},
  'Z10': {'name': 'Lucknow', 'coords': [26.846, 80.946]}
}

# Fixed costs scaled similarly
fixedCost = {'W1': 250000, 'W2': 300000, 'W3': 220000, 'W4': 180000, 'W5': 150000, 'W6': 170000, 'W7': 190000, 'W8': 200000}

transportCost = {}
rate_per_km = 100 # arbitrary transport rate for demonstration
for z, z_data in zones.items():
    transportCost[z] = {}
    for w, w_data in warehouses.items():
        dist = haversine(z_data['coords'][0], z_data['coords'][1], w_data['coords'][0], w_data['coords'][1])
        transportCost[z][w] = dist * rate_per_km

js_content = f"""// ─── Warehouse Locations ──────────────────────────────────────────────────────
const warehouses = {json.dumps(warehouses, indent=2)};

// ─── Demand Zones ─────────────────────────────────────────────────────────────
const zones = {json.dumps(zones, indent=2)};

// ─── Transport Cost Matrix ────────────────────────────────────────────────────
const transportCost = {json.dumps(transportCost, indent=2)};

// ─── Fixed Costs (mutable for sensitivity analysis) ──────────────────────────
let fixedCost = {json.dumps(fixedCost, indent=2)};

// ─── Explanations Library ─────────────────────────────────────────────────────
const explanations = {{
  "default": {{
    icon: "📊",
    headline: "Real-time Pan-India Logistics Overview",
    points: [
      "The optimal mathematical baseline considers physical distance between high-volume regions and hubs.",
      "Haversine distance calculations form the basis of the transport cost.",
      "Modify fixed cost parameters to explore supply chain flexibility.",
      "Watch out for large jump shifts if central hubs become too expensive!"
    ]
  }}
}};
"""

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
