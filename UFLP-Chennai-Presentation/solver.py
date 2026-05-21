import pulp
import itertools

def solve_uflp(warehouses, zones, fixed_costs, transport_costs):
    prob = pulp.LpProblem("UFLP", pulp.LpMinimize)

    # Decision Variables
    y = pulp.LpVariable.dicts("open", warehouses, cat="Binary")
    x = pulp.LpVariable.dicts("assign", (zones, warehouses), cat="Binary")

    # Objective
    prob += (
        pulp.lpSum(fixed_costs[w] * y[w] for w in warehouses) +
        pulp.lpSum(transport_costs[z][w] * x[z][w] for z in zones for w in warehouses)
    )

    # Constraints
    # 1. Each zone is assigned exactly once
    for z in zones:
        prob += pulp.lpSum(x[z][w] for w in warehouses) == 1

    # 2. Cannot assign to closed warehouse
    for z in zones:
        for w in warehouses:
            prob += x[z][w] <= y[w]

    # Solve
    prob.solve(pulp.PULP_CBC_CMD(msg=0))

    if pulp.LpStatus[prob.status] != 'Optimal':
        return {"status": "Error", "message": pulp.LpStatus[prob.status]}

    open_warehouses = [w for w in warehouses if pulp.value(y[w]) == 1]
    total_cost = pulp.value(prob.objective)
    fixed_total = sum(fixed_costs[w] for w in open_warehouses)
    transport_total = total_cost - fixed_total

    assignments = {}
    for z in zones:
        for w in warehouses:
            if pulp.value(x[z][w]) == 1:
                assignments[z] = {"w": w, "cost": transport_costs[z][w]}

    return {
        "status": "Optimal",
        "open_warehouses": open_warehouses,
        "total_cost": total_cost,
        "fixed_cost": fixed_total,
        "transport_cost": transport_total,
        "assignments": assignments
    }

def evaluate_cases(warehouses, zones, fixed_costs, transport_costs):
    cases = []
    combos = []
    for r in range(1, len(warehouses) + 1):
        for combo in itertools.combinations(warehouses, r):
            combos.append(list(combo))
    
    for i, w_list in enumerate(combos):
        fixed = sum(fixed_costs.get(w, 0) for w in w_list)
        transport = 0
        for z in zones:
            transport += min(transport_costs[z][w] for w in w_list)
        total = fixed + transport
        cases.append({
            "name": f"Case {i+1}",
            "label": f"C{i+1}",
            "w": w_list,
            "transport": transport,
            "fixed": fixed,
            "total": total
        })
    return cases
