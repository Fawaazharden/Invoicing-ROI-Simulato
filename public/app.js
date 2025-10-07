const inputIds = [
  'scenario_name',
  'monthly_invoice_volume',
  'num_ap_staff',
  'avg_hours_per_invoice',
  'hourly_wage',
  'error_rate_manual',
  'error_cost',
  'time_horizon_months',
  'one_time_implementation_cost',
];

const inputs = Object.fromEntries(
  inputIds.map((id) => [id, document.getElementById(id)])
);

const resultsEl = document.getElementById('results');
const scenarioListEl = document.getElementById('scenario-list');

function readPayload() {
  return {
    scenario_name: inputs.scenario_name.value.trim(),
    monthly_invoice_volume: Number(inputs.monthly_invoice_volume.value),
    num_ap_staff: Number(inputs.num_ap_staff.value),
    avg_hours_per_invoice: Number(inputs.avg_hours_per_invoice.value),
    hourly_wage: Number(inputs.hourly_wage.value),
    error_rate_manual: Number(inputs.error_rate_manual.value),
    error_cost: Number(inputs.error_cost.value),
    time_horizon_months: Number(inputs.time_horizon_months.value),
    one_time_implementation_cost: Number(inputs.one_time_implementation_cost.value),
  };
}

async function simulateAndRender() {
  try {
    const payload = readPayload();
    const res = await fetch('/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    renderResults(data);
  } catch {
    resultsEl.textContent = 'Failed to simulate';
  }
}

function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n || 0);
}

function renderResults(data) {
  const r = data?.results || {};
  const b = data?.breakdown || {};
  resultsEl.innerHTML = `
    <div class="grid-3">
      <div><div class="k">Labor cost (manual)</div><div class="v">${formatCurrency(b.labor_cost_manual)}</div></div>
      <div><div class="k">Automation cost</div><div class="v">${formatCurrency(b.auto_cost)}</div></div>
      <div><div class="k">Error savings</div><div class="v">${formatCurrency(b.error_savings)}</div></div>
      <div><div class="k">Monthly savings</div><div class="v emph">${formatCurrency(r.monthly_savings)}</div></div>
      <div><div class="k">Payback (months)</div><div class="v">${(r.payback_months || 0).toFixed(1)}</div></div>
      <div><div class="k">ROI (%)</div><div class="v">${(r.roi_percentage || 0).toFixed(1)}%</div></div>
      <div><div class="k">Cumulative savings</div><div class="v">${formatCurrency(r.cumulative_savings)}</div></div>
      <div><div class="k">Net savings</div><div class="v">${formatCurrency(r.net_savings)}</div></div>
    </div>
  `;
}

let debounceTimer = null;
inputIds.forEach((id) => {
  inputs[id].addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(simulateAndRender, 150);
  });
});

// Save scenario
document.getElementById('btn-save').addEventListener('click', async () => {
  const payload = readPayload();
  if (!payload.scenario_name) {
    alert('Please enter a scenario name first.');
    return;
  }
  const res = await fetch('/scenarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_name: payload.scenario_name, inputs: payload }),
  });
  if (!res.ok) {
    alert('Failed to save scenario');
    return;
  }
  await refreshScenarios();
  alert('Scenario saved');
});

// Report (email gated)
async function generateReport() {
  const email = prompt('Enter your email to receive the report:');
  if (!email) return;
  const payload = readPayload();
  const res = await fetch('/report/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, inputs: payload }),
  });
  if (!res.ok) {
    alert('Failed to generate report');
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'roi_report.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

document.getElementById('btn-report').addEventListener('click', generateReport);

async function refreshScenarios() {
  const res = await fetch('/scenarios');
  const data = await res.json();
  scenarioListEl.innerHTML = '';
  data.forEach((row) => {
    const li = document.createElement('li');
    const btnLoad = document.createElement('button');
    btnLoad.textContent = 'Load';
    btnLoad.addEventListener('click', async () => {
      const r = await fetch(`/scenarios/${row.id}`);
      if (!r.ok) return alert('Failed');
      const full = await r.json();
      // Populate inputs and re-simulate
      Object.entries(full.inputs || {}).forEach(([k, v]) => {
        if (inputs[k]) inputs[k].value = v;
      });
      inputs.scenario_name.value = row.scenario_name || '';
      await simulateAndRender();
    });

    const btnDelete = document.createElement('button');
    btnDelete.textContent = 'Delete';
    btnDelete.addEventListener('click', async () => {
      if (!confirm('Delete this scenario?')) return;
      const r = await fetch(`/scenarios/${row.id}`, { method: 'DELETE' });
      if (!r.ok && r.status !== 204) return alert('Failed');
      await refreshScenarios();
    });

    li.textContent = `${row.scenario_name || row.id}`;
    li.append(' ', btnLoad, ' ', btnDelete);
    scenarioListEl.appendChild(li);
  });
}

document.getElementById('btn-refresh').addEventListener('click', refreshScenarios);

// Initial render
simulateAndRender();
refreshScenarios();
