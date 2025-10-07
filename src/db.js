import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDirectory = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const dbFilePath = path.join(dataDirectory, 'scenarios.json');
const tempFilePath = path.join(dataDirectory, 'scenarios.tmp.json');

async function ensureDataFile() {
  await fs.mkdir(dataDirectory, { recursive: true });
  try {
    await fs.access(dbFilePath);
  } catch {
    const initial = { scenarios: [] };
    await fs.writeFile(dbFilePath, JSON.stringify(initial, null, 2), 'utf8');
  }
}

async function readDb() {
  await ensureDataFile();
  try {
    const content = await fs.readFile(dbFilePath, 'utf8');
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.scenarios)) {
      return { scenarios: [] };
    }
    return parsed;
  } catch {
    return { scenarios: [] };
  }
}

async function writeDb(data) {
  await fs.writeFile(tempFilePath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tempFilePath, dbFilePath);
}

let writeQueue = Promise.resolve();
function enqueueWrite(data) {
  writeQueue = writeQueue.then(() => writeDb(data)).catch(() => writeDb(data));
  return writeQueue;
}

export async function saveScenario(scenario) {
  const db = await readDb();
  const nowIso = new Date().toISOString();
  const record = {
    id: scenario.id || randomUUID(),
    scenario_name: scenario.scenario_name,
    inputs: scenario.inputs,
    results: scenario.results,
    created_at: nowIso,
  };
  db.scenarios.push(record);
  await enqueueWrite(db);
  return record;
}

export async function listScenarios() {
  const db = await readDb();
  return db.scenarios
    .map(({ id, scenario_name, created_at }) => ({ id, scenario_name, created_at }))
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
}

export async function getScenario(id) {
  const db = await readDb();
  return db.scenarios.find((s) => s.id === id) || null;
}

export async function deleteScenario(id) {
  const db = await readDb();
  const before = db.scenarios.length;
  db.scenarios = db.scenarios.filter((s) => s.id !== id);
  const changed = db.scenarios.length !== before;
  if (changed) await enqueueWrite(db);
  return changed;
}
