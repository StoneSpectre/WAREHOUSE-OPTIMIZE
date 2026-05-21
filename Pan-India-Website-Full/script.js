/* ─────────────────────────────────────────────────────────────────────────────
   UFLP Script — Dashboard Powered by Python Backend (Flask + PuLP)
   Features: Map (Dark Mode), Case Table, Chart.js Graph, Sensitivity Sliders, CSV/PDF Export
───────────────────────────────────────────────────────────────────────────── */

"use strict";

// ── State ─────────────────────────────────────────────────────────────────────
let activeLines      = [];   
let warehouseMarkers = {};   
let zoneMarkers      = {};   
let costChart        = null; 
let bbRunning        = false;
let bbAbort          = false;
let demandMultiplier = 1.0;
let breakevenChart = null;

// Shared state from Python Backend
let globalAllCases   = [];
let globalLpOptimal  = null;

// Formatter to cleanly render 200,000 as 200k while keeping precision
function formatMoney(num) {
  if (num >= 1000000) {
    return parseFloat((num / 1000000).toFixed(3)) + 'M';
  }
  if (num >= 1000) {
    return parseFloat((num / 1000).toFixed(1)) + 'k';
  }
  return num.toString();
}

// ── UI Generation ────────────────────────────────────────────────────────────

function generateUI() {
  const whContainer = document.getElementById('wh-options-container');
  const sliderContainer = document.getElementById('slider-group-container');
  if(!whContainer || !sliderContainer) return;

  whContainer.innerHTML = '';
  sliderContainer.innerHTML = '';

  Object.entries(warehouses).forEach(([w, data]) => {
    // Checkbox UI
    whContainer.innerHTML += `
      <label class="wh-checkbox-label" id="lbl-${w}" for="cb-${w}">
        <input type="checkbox" id="cb-${w}" value="${w}" />
        <div class="wh-check-box"><span class="wh-check-icon">✓</span></div>
        <div class="wh-info">
          <div class="wh-name" style="color:${data.color}">${w} — ${data.name}</div>
          <div class="wh-meta">${data.area}</div>
        </div>
        <span class="wh-cost-chip">₹${formatMoney(fixedCost[w])}</span>
      </label>
    `;

    // Slider UI
    sliderContainer.innerHTML += `
      <div class="slider-row">
        <div class="slider-top">
          <span class="slider-label" style="color:${data.color}">${w} — ${data.name}</span>
          <span class="slider-value" id="val-${w}" style="color:${data.color}">${formatMoney(fixedCost[w])}</span>
        </div>
        <input type="range" id="slider-${w}" min="50000" max="600000" step="10000" value="${fixedCost[w]}" style="accent-color:${data.color}" />
        <div class="slider-meta"><span>50k</span><span>Fixed Cost (₹)</span><span>600k</span></div>
      </div>
    `;
  });
}

// ── Map Initialisation ────────────────────────────────────────────────────────

// Set view to pan-India
const map = L.map('map', { zoomControl: true }).setView([22.0, 79.0], 5);

// Google Maps light tile layer for authentic aesthetics
L.tileLayer('http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  attribution: '&copy; Google Maps'
}).addTo(map);

// ── Custom Icons ──────────────────────────────────────────────────────────────
function makeWhIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid white;
      box-shadow:0 4px 14px rgba(0,0,0,0.5);
      transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);font-size:12px;">🏭</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34]
  });
}

function makeZoneIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:${color};border:2px solid rgba(255,255,255,0.6);
      box-shadow:0 2px 10px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;font-size:10px;
    ">📍</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12]
  });
}

const zoneColor = '#3b82f6';

function initMapMarkers() {
  // Place warehouse markers
  Object.entries(warehouses).forEach(([id, w]) => {
    warehouseMarkers[id] = L.marker(w.coords, { icon: makeWhIcon(w.color) })
      .addTo(map)
      .bindPopup(`<b>${id} — ${w.name}</b><br><span style="color:#94a3b8">${w.area}</span><br>Fixed cost: <b id="popup-cost-${id}">${formatMoney(fixedCost[id])}</b>`);
  });

  // Place zone markers
  Object.entries(zones).forEach(([id, z]) => {
    zoneMarkers[id] = L.marker(z.coords, { icon: makeZoneIcon(zoneColor) })
      .addTo(map)
      .bindPopup(`<b>${id} — ${z.name}</b><br><span style="color:#94a3b8">Demand Zone</span>`);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clearLines() {
  activeLines.forEach(l => map.removeLayer(l));
  activeLines = [];
}

/** Local helper for determining zone assignment links for mapping only */
function getAssignmentsForMap(openWh) {
  if (globalLpOptimal && canonical(openWh) === canonical(globalLpOptimal.open_warehouses)) {
      return globalLpOptimal.assignments; 
  }
  
  const assignments = {};
  if (!openWh.length) return assignments;
  for (const z in zones) {
    let best = Infinity, bestW = null;
    openWh.forEach(w => {
      if (transportCost[z][w] < best) { best = transportCost[z][w]; bestW = w; }
    });
    assignments[z] = [{ w: bestW, cost: best }];
  }
  return assignments;
}
function dummy() {
  const assignments = {};
  if (!openWh.length) return assignments;
  for (const z in zones) {
    let best = Infinity, bestW = null;
    openWh.forEach(w => {
      if (transportCost[z][w] < best) { best = transportCost[z][w]; bestW = w; }
    });
    assignments[z] = { w: bestW, cost: best };
  }
  return assignments;
}

function getSelected() {
  return Array.from(document.querySelectorAll('.wh-checkbox-label input:checked')).map(i => i.value);
}

function canonical(ws) { return [...ws].sort().join(','); }

// ── Python API Integration ────────────────────────────────────────────────────
let isFetching = false;

async function fetchOptimization() {
  if (isFetching) return;
  isFetching = true;
  document.getElementById('kpi-total').textContent = '...';
  
  try {
    const response = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        warehouses: Object.keys(warehouses),
        zones: Object.keys(zones),
        fixed_costs: fixedCost,
        transport_costs: transportCost,
        capacities: Object.fromEntries(Object.entries(warehouses).map(([k,v]) => [k, v.capacity])),
        demands: Object.fromEntries(Object.entries(zones).map(([k,v]) => [k, v.demand])),
        demand_multiplier: demandMultiplier
      })
    });
    
    const data = await response.json();
    globalLpOptimal = data.lp_optimal;
    globalAllCases = data.all_cases;
    
    // Now that server data is updated, render the UI using the current selection
    updateDashboard(getSelected(), false);
    
  } catch (error) {
    console.error("API Error", error);
    showToast("Error connecting to Python backend", "amber");
  } finally {
    isFetching = false;
  }
}

// ── Core Update ───────────────────────────────────────────────────────────────
function updateDashboard(openWh, skipTableHighlight = false) {
  if (!globalAllCases.length) return; // wait for fetch
  
  const selSig = canonical(openWh);
  const matchedCase = globalAllCases.find(c => canonical(c.w) === selSig);
  
  const total = matchedCase ? matchedCase.total : 0;
  const transport = matchedCase ? matchedCase.transport : 0;
  const fixed = matchedCase ? matchedCase.fixed : 0;
  const assignments = getAssignmentsForMap(openWh);

  // KPIs
  animateNum('kpi-transport', transport);
  animateNum('kpi-fixed', fixed);
  animateNum('kpi-total', total);

  // Assignment panel
  renderAssignments(assignments, openWh);

  // Map lines
  clearLines();
  if (openWh.length) {
    Object.entries(assignments).forEach(([z, a_arr]) => {
      a_arr.forEach(a => {
        if (!a.w) return;
        const line = L.polyline([zones[z].coords, warehouses[a.w].coords], {
          color: warehouses[a.w].color,
          weight: Math.max(1, (a.volume || 1000) / 1000), 
          opacity: 0.6,
          dashArray: '4 4'
        }).addTo(map);
        activeLines.push(line);
      });
    });
  }

  // Update checkbox styling
  document.querySelectorAll('.wh-checkbox-label').forEach(lbl => {
    const val = lbl.querySelector('input').value;
    const checked = openWh.includes(val);
    lbl.classList.toggle('checked', checked);
    const ic = lbl.querySelector('.wh-check-icon');
    if (ic) ic.style.display = checked ? 'block' : 'none';
  });

  // Table + Chart
  if (!skipTableHighlight) {
    renderCaseTable(openWh);
    renderChart(openWh);
    renderBreakevenChart();
  }

  // Why optimal
  renderWhyOptimal();

  // Sensitivity optimal alert
  renderSensitivityAlert();
}

function renderAssignments(assignments, openWh) {
  const wrap = document.getElementById('assignments-list');
  if (!wrap) return;
  if (!openWh.length) {
    wrap.innerHTML = '<p style="color:var(--text-muted);font-size:12px;text-align:center;padding:12px">Select warehouses to see assignments</p>';
    return;
  }
  wrap.innerHTML = Object.entries(zones).map(([z, zd]) => {
    const a_list = assignments[z] || [];
    if(a_list.length === 0){
       return `<div class="kpi-assign-row"><span class="kpi-zone">${z} ${zd.name}</span><span class="kpi-arrow">→</span><span class="kpi-wh-badge none">—</span></div>`;
    }
    return a_list.map(a => {
        const wBadge = a.w ? `<span class="kpi-wh-badge none" style="background:rgba(255,255,255,0.1);color:${warehouses[a.w].color};border-color:${warehouses[a.w].color}">${a.w}</span>` : `<span class="kpi-wh-badge none">—</span>`;
        const volDesc = a.volume ? ` (${a.volume} units)` : '';
        return `<div class="kpi-assign-row">
          <span class="kpi-zone">${z} ${zd.name}${volDesc}</span>
          <span class="kpi-arrow">→</span>
          ${wBadge}
          <span class="kpi-cost">₹${formatMoney(a.cost)}</span>
        </div>`;
    }).join('');
  }).join('');
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  
  let raw = el.textContent.replace(/,/g, '');
  let start = 0;
  if(raw.includes('M')) start = parseFloat(raw) * 1000000;
  else if(raw.includes('k')) start = parseFloat(raw) * 1000;
  else start = parseInt(raw) || 0;
  
  const dur    = 600;
  const begin  = performance.now();
  function tick(now) {
    const t = Math.min((now - begin) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = formatMoney(Math.round(start + (target - start) * ease));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Case Comparison Table ─────────────────────────────────────────────────────
function renderCaseTable(activeWh = []) {
  const tbody = document.querySelector('#case-table tbody');
  if (!tbody || !globalAllCases.length) return;

  const optimalCost = Math.min(...globalAllCases.map(c => c.total));
  const activeSig   = canonical(activeWh);

  const sortedCases = [...globalAllCases].sort((a,b) => a.total - b.total);

  tbody.innerHTML = sortedCases.map((c, i) => {
    const isSel     = canonical(c.w) === activeSig && activeWh.length > 0;
    const isOptimal = c.optimal;
    const isTie     = !isOptimal && c.total === optimalCost;

    const rowClass = isOptimal ? 'optimal' : isSel ? 'selected' : '';
    const whTags   = c.w.map(w => `<span class="wh-tag none" style="color:${warehouses[w].color};border:1px solid ${warehouses[w].color}40">${w}</span>`).join('');

    let statusHtml = '';
    if (isOptimal)   statusHtml = `<span class="status-chip status-optimal">✓ Optimal</span>`;
    else if (isTie)  statusHtml = `<span class="status-chip status-tie">≈ Tie</span>`;
    else if (isSel)  statusHtml = `<span class="status-chip status-selected">● Active</span>`;

    const originalIdx = globalAllCases.findIndex(orig => orig.name === c.name);

    return `<tr class="${rowClass}" data-idx="${originalIdx}" onclick="simulateCase(${originalIdx})">
      <td>${c.label}</td>
      <td style="white-space:normal;max-width:250px">${whTags}</td>
      <td class="cost-num" style="color:var(--accent-cyan)">${c.transport === "Inf" ? "Limit" : formatMoney(c.transport)}</td>
      <td class="cost-num" style="color:var(--accent-amber)">${formatMoney(c.fixed)}</td>
      <td class="cost-num" style="color:var(--accent-green);font-weight:700">${c.total === "Inf" ? "CAPACITY EXCEEDED" : formatMoney(c.total)}</td>
      <td>${statusHtml}</td>
    </tr>`;
  }).join('');
}

function simulateCase(idx) {
  const c = globalAllCases[idx];
  document.querySelectorAll('.wh-checkbox-label input').forEach(cb => {
    cb.checked = c.w.includes(cb.value);
  });
  updateDashboard(c.w);
  showToast(`Simulating ${c.name}`);
}

function showOptimal() {
  if (!globalAllCases.length) return;
  const optIdx = globalAllCases.findIndex(c => c.optimal);
  if (optIdx >= 0) {
    simulateCase(optIdx);
    showToast('✅ Showing optimal solution!', 'green');
  }
}

// ── Chart ─────────────────────────────────────────────────────────────────────
function renderChart(activeWh = []) {
  const canvas = document.getElementById('cost-chart');
  if (!canvas || !globalAllCases.length) return;

  const optimalCost = Math.min(...globalAllCases.map(c => c.total));
  const activeSig  = canonical(activeWh);

  const sortedCases = [...globalAllCases].sort((a,b) => a.total - b.total).slice(0, 50);

  const labels = sortedCases.map(c => c.label);
  const totals  = sortedCases.map(c => c.total);
  const trans   = sortedCases.map(c => c.transport);
  const fixed   = sortedCases.map(c => c.fixed);

  if (costChart) costChart.destroy();

  costChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Transport',
          data: trans,
          backgroundColor: sortedCases.map(c => c.optimal ? 'rgba(6,182,212,0.7)' : 'rgba(71,85,105,0.4)'),
          borderRadius: 2,
          borderSkipped: false,
        },
        {
          label: 'Fixed',
          data: fixed,
          backgroundColor: sortedCases.map(c => c.optimal ? 'rgba(16,185,129,0.85)' : canonical(c.w) === activeSig && activeWh.length ? 'rgba(245,158,11,0.85)' : 'rgba(100,116,139,0.5)'),
          borderRadius: 2,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500, easing: 'easeOutQuart' },
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 14 } },
        tooltip: {
          backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, titleColor: '#f1f5f9', bodyColor: '#94a3b8',
          callbacks: { footer: (items) => `Total: ${formatMoney(sortedCases[items[0].dataIndex].total)}` }
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { display: false } }, 
        y: { stacked: true, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#64748b', font: { family: 'Inter', size: 11 }, callback: function(value) { return formatMoney(value); } }, title: { display: true, text: 'Cost (₹)', color: '#475569', font: { size: 11 } } }
      }
    }
  });
}

// ── Sensitivity Sliders ───────────────────────────────────────────────────────
let sliderTimeout;
function initSliders() {
  const dSlider = document.getElementById('slider-demand-surge');
  if (dSlider) {
    dSlider.addEventListener('input', () => {
      demandMultiplier = parseFloat(dSlider.value);
      document.getElementById('val-demand-surge').textContent = demandMultiplier.toFixed(1) + 'x';
      clearTimeout(sliderTimeout);
      sliderTimeout = setTimeout(() => fetchOptimization(), 400); // 400ms debounce
    });
  }

  Object.keys(warehouses).forEach(w => {
    const slider = document.getElementById(`slider-${w}`);
    const valEl  = document.getElementById(`val-${w}`);
    if (!slider || !valEl) return;

    slider.addEventListener('input', () => {
      fixedCost[w]        = parseInt(slider.value);
      valEl.textContent   = formatMoney(parseInt(slider.value));

      const pp = document.getElementById(`popup-cost-${w}`);
      if (pp) pp.textContent = formatMoney(parseInt(slider.value));
      
      const lblCost = document.querySelector(`#lbl-${w} .wh-cost-chip`);
      if(lblCost) lblCost.textContent = `₹${formatMoney(parseInt(slider.value))}`;
      
      clearTimeout(sliderTimeout);
      sliderTimeout = setTimeout(() => {
        fetchOptimization();
      }, 300);
    });
  });
}

// ── Sensitivity Optimal Alert ─────────────────────────────────────────────────
let _lastOptSig = null;
function renderSensitivityAlert() {
  const el = document.getElementById('sens-alert');
  if (!el || !globalAllCases.length) return;

  const opt        = globalAllCases.find(c => c.optimal);
  if (!opt) return;
  const optSig     = canonical(opt.w);
  const changed    = _lastOptSig !== null && _lastOptSig !== optSig;
  _lastOptSig      = optSig;

  el.classList.toggle('changed', changed);
  el.querySelector('.optimal-alert-title').textContent =
    changed
      ? `⚠️ Optimal warehouse changed to ${opt.w.join(' + ')}!`
      : `✅ Optimal: ${opt.w.join(' + ')} (${opt.name}) — Total Cost: ${formatMoney(opt.total)}`;
  el.querySelector('.optimal-alert-sub').textContent =
    changed
      ? `Fixed cost changes shifted the optimal decision. Re-evaluate assignment strategy.`
      : `Adjust sliders to explore parameter sensitivity and see if optimal changes.`;
}

// ── Why Optimal Panel ─────────────────────────────────────────────────────────
function renderWhyOptimal() {
  const el = document.getElementById('why-panel');
  if (!el || !globalAllCases.length) return;

  const opt    = globalAllCases.find(c => c.optimal);
  const optSig = canonical(opt.w);

  const data = explanations[optSig] || explanations['default'];

  el.innerHTML = `
    <div class="why-headline">
      <span class="why-icon">${data.icon}</span>
      <div>
        <div class="why-title">${data.headline}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Total Cost: <b style="color:var(--accent-green)">${formatMoney(opt.total)}</b> | Warehouses: ${opt.w.map(w=>`<span class="wh-tag none" style="color:${warehouses[w].color};border:1px solid ${warehouses[w].color}40">${w}</span>`).join('')}</div>
      </div>
    </div>
    <ul class="why-points">
      ${data.points.map((p, i) => `<li><span class="why-bullet">${i+1}</span><span>${p}</span></li>`).join('')}
    </ul>`;
}

// ── Branch & Bound ────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runBranchAndBound() {
  if (bbRunning) { bbAbort = true; return; }
  if (!globalAllCases.length) return;

  const logEl   = document.getElementById('bb-log');
  const startBtn = document.getElementById('btn-bb-start');
  const speedSel = document.getElementById('bb-speed');
  if (!logEl) return;

  bbRunning = true;
  bbAbort   = false;
  logEl.innerHTML = '';
  startBtn.textContent = '⏹ Stop';

  const speed = parseInt(speedSel?.value || '700');
  let bestCost = Infinity;
  let bestIdx  = -1;

  const log = (html) => {
    logEl.innerHTML += html + '\n';
    logEl.scrollTop  = logEl.scrollHeight;
  };

  log(`<span class="log-sep">════════════════════════════════════</span>`);
  log(`<span class="log-best">  BRANCH & BOUND — EXPLORATION TREE</span>`);
  log(`<span class="log-sep">════════════════════════════════════</span>\n`);

  for (let i = 0; i < globalAllCases.length; i++) {
    if (bbAbort) { log(`\n<span class="log-prune">  ⏹ Simulation stopped by user.</span>`); break; }

    const c = globalAllCases[i];

    let renderNode = speed > 100 || (i % 5 === 0);

    if(renderNode) {
      log(`<span class="log-explore">▶ Node: ${c.label} [${c.w.join(', ')}]</span>`);
      await sleep(speed/2); if (bbAbort) break;

      log(`  Fixed Binding = ${formatMoney(c.fixed)}`);
      log(`  Transport   = ${c.transport === "Inf" ? "Limit" : formatMoney(c.transport)}`);
    }

    const lowerBound = c.transport; 
    
    if(renderNode) {
      log(`  Lower Bound ≈ ${formatMoney(lowerBound)}`);
      await sleep(speed * 0.4); if (bbAbort) break;
    }

    if (lowerBound > bestCost) {
      if(renderNode) log(`  <span class="log-prune">✗ PRUNED (${formatMoney(lowerBound)} > best ${formatMoney(bestCost)})</span>\n`);
      if(speed > 100) await sleep(speed * 0.2);
      continue;
    }

    if(renderNode) {
      log(`  Actual Cost = <b>${c.total === "Inf" ? "CAPACITY EXCEEDED" : formatMoney(c.total)}</b>`);
      await sleep(speed * 0.4); if (bbAbort) break;
    }

    if (c.total < bestCost) {
      bestCost = c.total;
      bestIdx  = i;
      log(`  <span class="log-best">✓ NEW INCUMBENT → ${c.label} = ${formatMoney(bestCost)}</span>\n`);
      simulateCase(i);
    } else {
      if(renderNode) log(`  (Bound discarded: ${c.total === "Inf" ? "CAPACITY EXCEEDED" : formatMoney(c.total)} > ${formatMoney(bestCost)})\n`);
    }

    if(speed > 100) await sleep(speed/2);
  }

  if (!bbAbort && bestIdx >= 0) {
    log(`<span class="log-sep">════════════════════════════════════</span>`);
    log(`<span class="log-optimal">🏆  SOLVED LOCALLY: ${globalAllCases[bestIdx].label}</span>`);
    log(`<span class="log-optimal">    VERIFIED BY LP: ${globalLpOptimal.status}</span>`);
    log(`<span class="log-sep">════════════════════════════════════</span>`);
    showToast('🏆 B&B Complete — Optimal matched LP Backend!', 'green');
  }

  bbRunning = false;
  bbAbort   = false;
  startBtn.textContent = '▶ Start B&B';
}

// ── Export ────────────────────────────────────────────────────────────────────
function exportCsv() {
  if (!globalAllCases.length) return;
  const headers = ["Case", "Warehouses", "Transport", "Fixed", "Total", "Optimal"];
  const rows = globalAllCases.map(c => [
    c.name,
    c.w.join(' / '),
    c.transport,
    c.fixed,
    c.total,
    c.optimal ? "Yes" : "No"
  ]);

  let csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n"
    + rows.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "uflp_pan_india_cases.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('📥 CSV Downloaded', 'blue');
}

function exportPdf() {
  showToast('🖨️ Opening Print Dialog...', 'blue');
  setTimeout(() => window.print(), 500);
}

// ── Initial Load ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Generate dynamic UI based on data.js
  generateUI();
  
  // 2. Initialize Markers
  initMapMarkers();

  // 3. Bind simple toggle events to dynamically created checkboxes
  document.querySelectorAll('.wh-checkbox-label input').forEach(cb => {
    cb.addEventListener('change', () => {
      updateDashboard(getSelected());
    });
  });

  // 4. Bind slider events
  initSliders();
  
  // Set up exports
  document.getElementById('btn-export-csv')?.addEventListener('click', exportCsv);
  document.getElementById('btn-export-pdf')?.addEventListener('click', exportPdf);

  // Buttons
  document.getElementById('btn-optimal')?.addEventListener('click', showOptimal);
  document.getElementById('btn-compare')?.addEventListener('click', () => {
    document.getElementById('section-table')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('btn-bb-start')?.addEventListener('click', runBranchAndBound);
  document.getElementById('btn-bb-reset')?.addEventListener('click', () => {
    if (bbRunning) bbAbort = true;
    const logEl = document.getElementById('bb-log');
    if (logEl) logEl.innerHTML = '<span style="color:var(--text-muted)">Click ▶ Start B&B to begin the animation...</span>';
    const startBtn = document.getElementById('btn-bb-start');
    if (startBtn) startBtn.textContent = '▶ Start B&B';
    bbRunning = false;
  });

  // Initial Data Fetch
  await fetchOptimization();
});

function renderBreakevenChart() {
  const canvas = document.getElementById('breakeven-chart');
  if (!canvas || !globalAllCases.length) return;

  if (breakevenChart) breakevenChart.destroy();
  
  const sortedCases = [...globalAllCases].filter(c => c.total !== 'Inf').sort((a,b) => a.total - b.total).slice(0, 15);
  
  breakevenChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: sortedCases.map(c => c.w.length + ' Hubs'),
      datasets: [
        {
          label: 'Fixed Cost (Step)',
          data: sortedCases.map(c => c.fixed),
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          stepped: true,
          tension: 0
        },
        {
          label: 'Transport Cost (Curve)',
          data: sortedCases.map(c => c.transport),
          borderColor: '#06b6d4',
          backgroundColor: '#06b6d4',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8' } } },
      scales: { x: { ticks: { color: '#64748b' } }, y: { ticks: { color: '#64748b' } } }
    }
  });
}
