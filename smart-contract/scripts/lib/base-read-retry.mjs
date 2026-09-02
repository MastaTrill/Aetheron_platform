export const DEFAULT_READ_ATTEMPTS = 5;
export const DEFAULT_READ_DELAY_MS = 1500;

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function describeReadError(error) {
  return error?.shortMessage || error?.reason || error?.message || String(error);
}

export function isTransientReadError(error) {
  const code = error?.code || "";
  if (["BAD_DATA", "NETWORK_ERROR", "SERVER_ERROR", "TIMEOUT", "UNKNOWN_ERROR"].includes(code)) {
    return true;
  }

  const message = describeReadError(error).toLowerCase();
  return /could not decode result data|missing response|network|timeout|timed out|rate limit|429|502|503|504|gateway|socket|empty response/.test(message);
}

export async function readWithRetry(read, label, options = {}) {
  const attempts = options.attempts ?? DEFAULT_READ_ATTEMPTS;
  const delayMs = options.delayMs ?? DEFAULT_READ_DELAY_MS;
  const validate = options.validate ?? ((value) => value !== null && value !== undefined);
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const value = await read();
      if (!validate(value)) {
        const invalidResult = new Error(`${label} returned an invalid result`);
        invalidResult.code = "INVALID_READ_RESULT";
        throw invalidResult;
      }
      return value;
    } catch (error) {
      lastError = error;
      const retryable = error?.code === "INVALID_READ_RESULT" || isTransientReadError(error);
      if (!retryable || attempt === attempts) break;
      console.warn(`${label} read attempt ${attempt}/${attempts} failed: ${describeReadError(error)}`);
      await sleep(delayMs);
    }
  }

  throw new Error(`${label} could not be read after ${attempts} attempts: ${describeReadError(lastError)}`);
}

export function callViewWithRetry(contract, method, args = [], label = `${method}()`, options = {}) {
  return readWithRetry(() => contract[method](...args), label, options);
}

export function providerReadWithRetry(provider, method, args = [], label = method, options = {}) {
  return readWithRetry(() => provider[method](...args), label, options);
}
