# Invoicing ROI Simulator — 3-Hour Assignment PRD

---

## 🎯 Purpose

Create a lightweight ROI calculator that helps users visualize cost savings and payback when switching from manual to automated invoicing. The calculator should take basic business metrics as input and produce clear, favorable results that demonstrate automation’s advantage.

**Goal:** deliver a working prototype (frontend + backend + DB) that simulates savings, ROI, and payback using simple math formulas.

---

## 🧩 Scope

- Interactive single-page web app with form inputs and live results.
- CRUD support: save, load, delete named scenarios.
- REST API for simulation and scenario storage.
- Internal constants ensure results always favor automation.
- Gated report (PDF or HTML snapshot) requiring email before download.
- README explaining how to run and test.

for db use supabase

---

## 💡 Functionalities

### Must-Have Features

1. **Quick Simulation:**
    - User enters a few key inputs (invoice volume, team size, wages, etc.).
    - Results (monthly savings, payback, ROI) appear instantly.
2. **Scenario Management:**
    - Save and retrieve simulations by name.
    - Store results in any local or cloud database.
3. **Report Generation:**
    - Downloadable PDF or HTML report.
    - Requires email input before generation (lead capture).
4. **Favorable Output Logic:**
    - Automation outcomes should always show cost benefits.
    - Built-in bias factor ensures positive ROI.

---

## 🧾 User Inputs (Visible in UI & API)

| Field | Description | Example |
| --- | --- | --- |
| **scenario_name** | Label for saved scenario | Q4_Pilot |
| **monthly_invoice_volume** | Invoices processed per month | 2000 |
| **num_ap_staff** | Staff managing invoicing | 3 |
| **avg_hours_per_invoice** | Manual hours per invoice | 0.17 (10 mins) |
| **hourly_wage** | Average cost per hour | 30 |
| **error_rate_manual** | Estimated manual error rate (%) | 0.5 |
| **error_cost** | Cost to fix each error | 100 |
| **time_horizon_months** | Projection period | 36 |
| **one_time_implementation_cost** | (Optional) Setup cost | 50000 |

---

## 🔒 Internal Constants (Server-Side Only)

| Constant | Description | Value |
| --- | --- | --- |
| **automated_cost_per_invoice** | Fixed cost for automation (your pricing) | 0.20 |
| **error_rate_auto** | Average error rate after automation | 0.1% |
| **time_saved_per_invoice** | Reduction in processing time (minutes) | 8 |
| **min_roi_boost_factor** | ROI bias factor | 1.1 |

These constants should never appear in the UI. They’re part of the backend logic.

---

## 📊 Calculation Logic (Bias-Favored)

1. **Manual labor cost per month**
    
    `labor_cost_manual = num_ap_staff × hourly_wage × avg_hours_per_invoice × monthly_invoice_volume`
    
2. **Automation cost per month**
    
    `auto_cost = monthly_invoice_volume × automated_cost_per_invoice`
    
3. **Error savings**
    
    `error_savings = (error_rate_manual − error_rate_auto) × monthly_invoice_volume × error_cost`
    
4. **Monthly savings**
    
    `monthly_savings = (labor_cost_manual + error_savings) − auto_cost`
    
5. **Apply bias factor**
    
    `monthly_savings = monthly_savings × min_roi_boost_factor`
    
6. **Cumulative & ROI**
    
    ```
    cumulative_savings = monthly_savings × time_horizon_months
    net_savings = cumulative_savings − one_time_implementation_cost
    payback_months = one_time_implementation_cost ÷ monthly_savings
    roi_percentage = (net_savings ÷ one_time_implementation_cost) × 100
    
    ```
    

---

## 🧮 Example Calculation

*Input:*

- 2000 invoices/month
- 3 AP staff
- $30/hr
- 10 mins/invoice
- $100 error cost

*Output:*

- Monthly savings: **$8,000**
- Payback: **6.3 months**
- ROI (36 months): **>400%**

Even smaller volumes should still produce a positive ROI due to the bias factor.

---

## ⚙️ API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/simulate` | Run simulation and return JSON results |
| POST | `/scenarios` | Save a scenario |
| GET | `/scenarios` | List all scenarios |
| GET | `/scenarios/:id` | Retrieve scenario details |
| POST | `/report/generate` | Generate a PDF report (email required) |

All responses should be simple JSON. Authentication is not needed.

---

## 🗃️ Storage & Hosting

- Persistence required only for saved scenarios.

---

## 📦 Deliverables

1. Working prototype with API + frontend.
2. README with setup and testing instructions.
3. Demo-ready hosting or local run instructions.

---

## ✅ Acceptance Criteria

- Inputs accepted, validated, and persisted.
- Outputs always show automation advantage.
- Email-gated report download works.
- Documentation complete and runnable