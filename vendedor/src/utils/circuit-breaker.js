const path = require('path');
const { loadJSON, saveJSON } = require('./file-store');

const VENDEDOR_ROOT = path.resolve(__dirname, '..', '..');
const CIRCUIT_BREAKERS_FILE = path.join(VENDEDOR_ROOT, 'data', 'metrics', 'integration-circuit-breakers.json');

const DEFAULT_POLICY = Object.freeze({
  failureThreshold: 3,
  cooldownMs: 30000
});

function loadCircuitStore(file = CIRCUIT_BREAKERS_FILE) {
  return loadJSON(file, { circuits: {}, updated_at: null });
}

function saveCircuitStore(store, file = CIRCUIT_BREAKERS_FILE) {
  store.updated_at = new Date().toISOString();
  saveJSON(file, store);
  return store;
}

function getCircuit(name, store) {
  if (!store.circuits) store.circuits = {};
  if (!store.circuits[name]) {
    store.circuits[name] = {
      state: 'closed',
      consecutive_failures: 0,
      last_error: null,
      last_failure_at: null,
      last_success_at: null,
      opened_at: null,
      last_metadata: null
    };
  }
  return store.circuits[name];
}

function canExecute(name, policy = {}, store = loadCircuitStore(), now = Date.now()) {
  const merged = {
    failureThreshold: Number(policy.failureThreshold || DEFAULT_POLICY.failureThreshold),
    cooldownMs: Number(policy.cooldownMs || DEFAULT_POLICY.cooldownMs)
  };

  const circuit = getCircuit(name, store);
  const openedAt = circuit.opened_at ? new Date(circuit.opened_at).getTime() : null;
  const isOpen = circuit.state === 'open'
    && openedAt !== null
    && circuit.consecutive_failures >= merged.failureThreshold
    && (now - openedAt) < merged.cooldownMs;

  return {
    ok: !isOpen,
    name,
    state: isOpen ? 'open' : circuit.state,
    retry_after_ms: isOpen ? Math.max(merged.cooldownMs - (now - openedAt), 0) : 0,
    policy: merged,
    circuit: { ...circuit }
  };
}

function recordCircuitSuccess(name, { file = CIRCUIT_BREAKERS_FILE, metadata = {} } = {}) {
  const store = loadCircuitStore(file);
  const circuit = getCircuit(name, store);
  const now = new Date().toISOString();
  circuit.state = 'closed';
  circuit.consecutive_failures = 0;
  circuit.last_error = null;
  circuit.last_success_at = now;
  circuit.opened_at = null;
  circuit.last_metadata = metadata;
  saveCircuitStore(store, file);
  return { ...circuit };
}

function recordCircuitFailure(name, { file = CIRCUIT_BREAKERS_FILE, policy = {}, error = null, metadata = {} } = {}) {
  const store = loadCircuitStore(file);
  const merged = {
    failureThreshold: Number(policy.failureThreshold || DEFAULT_POLICY.failureThreshold),
    cooldownMs: Number(policy.cooldownMs || DEFAULT_POLICY.cooldownMs)
  };
  const circuit = getCircuit(name, store);
  const now = new Date().toISOString();
  circuit.consecutive_failures = Number(circuit.consecutive_failures || 0) + 1;
  circuit.last_failure_at = now;
  circuit.last_error = error?.message || String(error || 'unknown error');
  circuit.last_metadata = metadata;
  if (circuit.consecutive_failures >= merged.failureThreshold) {
    circuit.state = 'open';
    circuit.opened_at = now;
  }
  saveCircuitStore(store, file);
  return { ...circuit, policy: merged };
}

module.exports = {
  CIRCUIT_BREAKERS_FILE,
  DEFAULT_POLICY,
  loadCircuitStore,
  saveCircuitStore,
  canExecute,
  recordCircuitSuccess,
  recordCircuitFailure
};
