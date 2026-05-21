// ─── Warehouse Locations ──────────────────────────────────────────────────────
const warehouses = {
  "W1": {
    "capacity": 4500,
    "name": "Bhiwandi",
    "area": "Mumbai Hub",
    "coords": [
      19.296,
      73.058
    ],
    "color": "#fbbf24"
  },
  "W2": {
    "capacity": 4000,
    "name": "Gurugram",
    "area": "NCR Hub",
    "coords": [
      28.459,
      76.98
    ],
    "color": "#34d399"
  },
  "W3": {
    "capacity": 3800,
    "name": "Hoskote",
    "area": "Bengaluru Hub",
    "coords": [
      13.069,
      77.798
    ],
    "color": "#a78bfa"
  },
  "W4": {
    "capacity": 2500,
    "name": "Sriperumbudur",
    "area": "Chennai Hub",
    "coords": [
      12.971,
      79.943
    ],
    "color": "#f472b6"
  },
  "W5": {
    "capacity": 2800,
    "name": "Sanand",
    "area": "Ahmedabad Hub",
    "coords": [
      22.986,
      72.38
    ],
    "color": "#38bdf8"
  },
  "W6": {
    "capacity": 3000,
    "name": "Dankuni",
    "area": "Kolkata Hub",
    "coords": [
      22.678,
      88.307
    ],
    "color": "#f87171"
  },
  "W7": {
    "capacity": 3200,
    "name": "Medchal",
    "area": "Hyderabad Hub",
    "coords": [
      17.629,
      78.482
    ],
    "color": "#c084fc"
  },
  "W8": {
    "capacity": 3500,
    "name": "Chakan",
    "area": "Pune Hub",
    "coords": [
      18.75,
      73.85
    ],
    "color": "#818cf8"
  }
};

// ─── Demand Zones ─────────────────────────────────────────────────────────────
const zones = {
  "Z1": {
    "demand": 1400,
    "name": "Delhi",
    "coords": [
      28.613,
      77.209
    ]
  },
  "Z2": {
    "demand": 1800,
    "name": "Mumbai",
    "coords": [
      19.076,
      72.877
    ]
  },
  "Z3": {
    "demand": 1500,
    "name": "Bengaluru",
    "coords": [
      12.971,
      77.594
    ]
  },
  "Z4": {
    "demand": 1000,
    "name": "Chennai",
    "coords": [
      13.082,
      80.27
    ]
  },
  "Z5": {
    "demand": 800,
    "name": "Kolkata",
    "coords": [
      22.572,
      88.363
    ]
  },
  "Z6": {
    "demand": 900,
    "name": "Hyderabad",
    "coords": [
      17.385,
      78.486
    ]
  },
  "Z7": {
    "demand": 700,
    "name": "Pune",
    "coords": [
      18.52,
      73.856
    ]
  },
  "Z8": {
    "demand": 600,
    "name": "Ahmedabad",
    "coords": [
      23.022,
      72.571
    ]
  },
  "Z9": {
    "demand": 500,
    "name": "Jaipur",
    "coords": [
      26.912,
      75.787
    ]
  },
  "Z10": {
    "demand": 400,
    "name": "Lucknow",
    "coords": [
      26.846,
      80.946
    ]
  }
};

// ─── Transport Cost Matrix ────────────────────────────────────────────────────
const transportCost = {
  "Z1": {
    "demand": 1400,
    "W1": 111800,
    "W2": 2800,
    "W3": 172900,
    "W4": 176200,
    "W5": 79000,
    "W6": 129200,
    "W7": 122800,
    "W8": 114800
  },
  "Z2": {
    "demand": 1800,
    "W1": 3000,
    "W2": 112300,
    "W3": 84900,
    "W4": 101500,
    "W5": 43700,
    "W6": 165100,
    "W7": 61200,
    "W8": 10800
  },
  "Z3": {
    "demand": 1500,
    "W1": 85300,
    "W2": 172300,
    "W3": 2400,
    "W4": 25400,
    "W5": 124200,
    "W6": 156400,
    "W7": 52600,
    "W8": 75700
  },
  "Z4": {
    "demand": 1000,
    "W1": 103400,
    "W2": 174300,
    "W3": 26700,
    "W4": 3700,
    "W5": 138000,
    "W6": 136300,
    "W7": 54000,
    "W8": 93100
  },
  "Z5": {
    "demand": 800,
    "W1": 162900,
    "W2": 131500,
    "W3": 153700,
    "W4": 138900,
    "W5": 163800,
    "W6": 1300,
    "W7": 116800,
    "W8": 156700
  },
  "Z6": {
    "demand": 900,
    "W1": 61000,
    "W2": 124000,
    "W3": 48500,
    "W4": 51500,
    "W5": 89000,
    "W6": 118200,
    "W7": 2700,
    "W8": 51300
  },
  "Z7": {
    "demand": 700,
    "W1": 12000,
    "W2": 114900,
    "W3": 73800,
    "W4": 89700,
    "W5": 51900,
    "W6": 157200,
    "W7": 49800,
    "W8": 2500
  },
  "Z8": {
    "demand": 600,
    "W1": 41700,
    "W2": 74800,
    "W3": 123600,
    "W4": 136100,
    "W5": 1900,
    "W6": 161200,
    "W7": 85900,
    "W8": 49300
  },
  "Z9": {
    "demand": 500,
    "W1": 89100,
    "W2": 20800,
    "W3": 155300,
    "W4": 160900,
    "W5": 55500,
    "W6": 134700,
    "W7": 106800,
    "W8": 92800
  },
  "Z10": {
    "demand": 400,
    "W1": 116300,
    "W2": 42900,
    "W3": 156600,
    "W4": 154600,
    "W5": 96400,
    "W6": 87500,
    "W7": 105500,
    "W8": 115600
  }
};

// ─── Fixed Costs (mutable for sensitivity analysis) ──────────────────────────
let fixedCost = {
  "W1": 250000,
  "W2": 300000,
  "W3": 220000,
  "W4": 180000,
  "W5": 150000,
  "W6": 170000,
  "W7": 190000,
  "W8": 200000
};

// ─── Explanations Library ─────────────────────────────────────────────────────
const explanations = {
  "default": {
    icon: "📊",
    headline: "Real-time Pan-India Logistics Overview",
    points: [
      "The optimal mathematical baseline considers physical distance between high-volume regions and hubs.",
      "Haversine distance calculations form the basis of the transport cost.",
      "Modify fixed cost parameters to explore supply chain flexibility.",
      "Watch out for large jump shifts if central hubs become too expensive!"
    ]
  }
};
