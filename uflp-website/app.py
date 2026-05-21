from flask import Flask, jsonify, request
from solver import solve_uflp, evaluate_cases

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

    # Compute true optimal with PuLP
    lp_solution = solve_uflp(warehouses, zones, fixed_costs, transport_costs)
    
    # Compute all permutations for the dashboard components
    all_cases = evaluate_cases(warehouses, zones, fixed_costs, transport_costs)
    
    # Identify the optimal in the enumeration to mark it explicitly
    optimal_cost = min(c['total'] for c in all_cases)
    for c in all_cases:
        c['optimal'] = (c['total'] == optimal_cost)

    return jsonify({
        "lp_optimal": lp_solution,
        "all_cases": all_cases
    })

if __name__ == '__main__':
    # Running locally
    app.run(port=5000, debug=True)
