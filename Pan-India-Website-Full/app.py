from flask import Flask, jsonify, request
from solver import solve_cflp, evaluate_cases

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/optimize', methods=['POST'])
def optimize():
    data = request.json
    
    # Extract data from the frontend
    warehouses = data.get('warehouses', [])
    zones = data.get('zones', [])
    fixed_costs = data.get('fixed_costs', {})
    transport_costs = data.get('transport_costs', {})
    
    # CFLP Specific Data
    capacities = data.get('capacities', {})
    base_demands = data.get('demands', {})
    demand_multiplier = float(data.get('demand_multiplier', 1.0))
    
    # Scale demand based on stress-test slider
    demands = {z: base_demands[z] * demand_multiplier for z in zones}

    # Compute true optimal with PuLP CFLP Algorithm
    lp_solution = solve_cflp(warehouses, zones, fixed_costs, transport_costs, capacities, demands)
    
    # Compute all permutations for the dashboard components
    all_cases = evaluate_cases(warehouses, zones, fixed_costs, transport_costs, capacities, demands)
    
    # Identify the optimal in the enumeration to mark it explicitly (Ignore Inf)
    valid_cases = [c for c in all_cases if c['total'] != "Inf"]
    if valid_cases:
        optimal_cost = min(c['total'] for c in valid_cases)
        for c in all_cases:
            c['optimal'] = (c['total'] == optimal_cost)
    else:
        for c in all_cases:
            c['optimal'] = False

    return jsonify({
        "lp_optimal": lp_solution,
        "all_cases": all_cases
    })

if __name__ == '__main__':
    # Running locally
    app.run(port=5001, debug=True)
