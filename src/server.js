import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import { simulate } from './calculator.js';
import { saveScenario, listScenarios, getScenario, deleteScenario } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// POST /simulate
app.post('/simulate', (req, res) => {
  try {
    const result = simulate(req.body || {});
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: 'Invalid input', details: String(err?.message || err) });
  }
});

// Scenarios CRUD (minimal per PRD)
app.post('/scenarios', async (req, res) => {
  try {
    const { scenario_name, inputs } = req.body || {};
    if (!scenario_name || typeof scenario_name !== 'string') {
      return res.status(400).json({ error: 'scenario_name is required' });
    }
    const sim = simulate(inputs || {});
    const saved = await saveScenario({
      scenario_name,
      inputs: sim.inputs,
      results: sim.results,
    });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save scenario', details: String(err?.message || err) });
  }
});

app.get('/scenarios', async (_req, res) => {
  try {
    const rows = await listScenarios();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list scenarios', details: String(err?.message || err) });
  }
});

app.get('/scenarios/:id', async (req, res) => {
  try {
    const row = await getScenario(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get scenario', details: String(err?.message || err) });
  }
});

app.delete('/scenarios/:id', async (req, res) => {
  try {
    const ok = await deleteScenario(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete scenario', details: String(err?.message || err) });
  }
});

// POST /report/generate (email required), returns PDF
app.post('/report/generate', async (req, res) => {
  try {
    const { email, inputs } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    const sim = simulate(inputs || {});

    // Create PDF on the fly
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="roi_report.pdf"');

    doc.pipe(res);

    doc.fontSize(20).text('Invoicing ROI Report', { align: 'left' });
    doc.moveDown();
    doc.fontSize(12).text(`Requested by: ${email}`);
    if (sim.scenario_name) doc.text(`Scenario: ${sim.scenario_name}`);
    doc.moveDown();

    doc.fontSize(14).text('Inputs');
    Object.entries(sim.inputs).forEach(([k, v]) => {
      doc.fontSize(10).text(`${k}: ${v}`);
    });

    doc.moveDown();
    doc.fontSize(14).text('Results');
    Object.entries(sim.results).forEach(([k, v]) => {
      const value = typeof v === 'number' ? Math.round(v * 100) / 100 : v;
      doc.fontSize(10).text(`${k}: ${value}`);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report', details: String(err?.message || err) });
  }
});

// Export for Vercel serverless
export default app;

// Local development server
if (process.env.NODE_ENV !== 'production') {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${port}`);
  });
}
