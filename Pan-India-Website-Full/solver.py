import pulp
import itertools

def solve_cflp(warehouses, zones, fixed_costs, transport_costs, capacities, demands):
    prob = pulp.LpProblem("CFLP", pulp.LpMinimize)

    # Decision Variables
    y = pulp.LpVariable.dicts("open", warehouses, cat="Binary")
    x = pulp.LpVariable.dicts("assign", (zones, warehouses), lowBound=0, cat="Continuous")

    # Objective
    prob += (
        pulp.lpSum(fixed_costs[w] * y[w] for w in warehouses) +
        pulp.lpSum(transport_costs[z][w] * x[z][w] for z in zones for w in warehouses)
    )

    # Constraints
    # 1. Total demand met for each zone
    for z in zones:
        prob += pulp.lpSum(x[z][w] for w in warehouses) == demands[z]

    # 2. Total outbound flow from warehouse cannot exceed its capacity (and only if open)
    for w in warehouses:
        prob += pulp.lpSum(x[z][w] for z in zones) <= capacities[w] * y[w]

    # Solve
    prob.solve(pulp.PULP_CBC_CMD(msg=0))

    if pulp.LpStatus[prob.status] != 'Optimal':
        return {"status": "Infeasible", "message": "Total active capacity is insufficient to meet demand"}

    open_warehouses = [w for w in warehouses if pulp.value(y[w]) > 0.5]
    total_cost = pulp.value(prob.objective)
    fixed_total = sum(fixed_costs[w] for w in open_warehouses)
    transport_total = total_cost - fixed_total

    assignments = {}
    for z in zones:
        assignments[z] = []
        for w in warehouses:
            val = pulp.value(x[z][w])
            if val is not None and val > 0.01:
                assignments[z].append({
                    "w": w,
                    "volume": float(val),
                    "cost": float(val * transport_costs[z][w])
                })

    return {
        "status": "Optimal",
        "open_warehouses": open_warehouses,
        "total_cost": total_cost,
        "fixed_cost": fixed_total,
        "transport_cost": transport_total,
        "assignments": assignments
    }


def _solve_sub_transport(w_list, zones, transport_costs, capacities, demands):
    """Solves the pure transportation problem for a fixed subset of open warehouses."""
    if sum(capacities[w] for w in w_list) < sum(demands[z] for z in zones):
        return None # Infeasible due to missing capacity
        
    prob = pulp.LpProblem("Sub", pulp.LpMinimize)
    x = pulp.LpVariable.dicts("assign", (zones, w_list), lowBound=0, cat="Continuous")
    
    prob += pulp.lpSum(transport_costs[z][w] * x[z][w] for z in zones for w in w_list)
    
    for z in zones:
        prob += pulp.lpSum(x[z][w] for w in w_list) == demands[z]
        
    for w in w_list:
        prob += pulp.lpSum(x[z][w] for z in zones) <= capacities[w]
        
    prob.solve(pulp.PULP_CBC_CMD(msg=0))
    if pulp.LpStatus[prob.status] == 'Optimal':
        return float(pulp.value(prob.objective))
    return None


def evaluate_cases(warehouses, zones, fixed_costs, transport_costs, capacities, demands):
    cases = []
    combos = []
    for r in range(1, len(warehouses) + 1):
        for combo in itertools.combinations(warehouses, r):
            combos.append(list(combo))
    
    for i, w_list in enumerate(combos):
        fixed = sum(fixed_costs.get(w, 0) for w in w_list)
        transport = _solve_sub_transport(w_list, zones, transport_costs, capacities, demands)
        
        if transport is None:
            # If a topological configuration violates physical capacity limits,
            # we assign a massive penalty constraint so Branch & Bound cleanly avoids it.
            transport = float('inf')
            total = float('inf')
        else:
            total = fixed + transport
            
        cases.append({
            "name": f"Case {i+1}",
            "label": f"C{i+1}",
            "w": w_list,
            "transport": transport if transport != float('inf') else "Inf",
            "fixed": fixed,
            "total": total if total != float('inf') else "Inf"
        })
    return cases
