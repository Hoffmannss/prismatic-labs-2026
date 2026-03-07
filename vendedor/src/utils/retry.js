const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(task, options = {}) {
  const attempts = Math.max(Number(options.attempts || 3), 1);
  const baseDelayMs = Math.max(Number(options.baseDelayMs || 1000), 0);
  const factor = Math.max(Number(options.factor || 2), 1);
  const label = options.label || 'retryable-task';

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) break;
      const delay = baseDelayMs * Math.pow(factor, attempt - 1);
      if (typeof options.onRetry === 'function') {
        options.onRetry({ attempt, attempts, delay, label, error });
      }
      await sleep(delay);
    }
  }

  throw new Error(`${label} failed after ${attempts} attempts: ${lastError?.message || 'unknown error'}`);
}

module.exports = {
  sleep,
  withRetry
};
