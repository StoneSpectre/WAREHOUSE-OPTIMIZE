// ─── Warehouse Locations ───
const warehouses = {
  'W1': { name: 'Oragadam', area: 'Industrial Hub · South-West', coords: [12.83, 79.91], color: '#f59e0b' },
  'W2': { name: 'Ambattur', area: 'Central Location · North-West', coords: [13.11, 80.16], color: '#10b981' },
  'W3': { name: 'Sriperumbudur', area: 'Western Corridor · SW', coords: [12.97, 79.94], color: '#8b5cf6' }
};

// ─── Demand Zones ───
const zones = {
  'Z1': { name: 'Chennai Port', coords: [13.08, 80.29] },
  'Z2': { name: 'Anna Nagar', coords: [13.08, 80.21] },
  'Z3': { name: 'Guindy', coords: [13.01, 80.21] },
  'Z4': { name: 'Tambaram', coords: [12.92, 80.11] },
  'Z5': { name: 'OMR IT Corridor', coords: [12.85, 80.22] }
};

const transportCost = { Z1: {W1: 45, W2: 20, W3: 50}, Z2: {W1: 35, W2: 12, W3: 38}, Z3: {W1: 25, W2: 18, W3: 30}, Z4: {W1: 15, W2: 25, W3: 20}, Z5: {W1: 20, W2: 30, W3: 28} };
let fixedCost = { 'W1': 20, 'W2': 30, 'W3': 15 };

const explanations = {
  'W1,W2,W3': { icon: '▶️', headline: 'Maximum Saturation', points: ['All facilities are open.', 'Minimal transport times but bloated fixed costs.'] },
  'W2,W3': { icon: '✅', headline: 'The Optimal Baseline', points: ['Balances fixed costs ($45M) and transport efficiency.', 'W2 handles inner city zones; W3 covers outer rings.'] },
  'default': { icon: '⚠️', headline: 'Sub-optimal Configuration', points: ['This exact configuration leaves certain zones under-served.', 'Cost balance is off.'] }
};
