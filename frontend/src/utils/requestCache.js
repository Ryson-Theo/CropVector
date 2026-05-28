const cacheStore = new Map();
const promiseStore = new Map();

export function getCachedData(key) {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (entry.error) {
    throw entry.error;
  }
  return entry.value;
}

export function clearCachedData(key) {
  cacheStore.delete(key);
  promiseStore.delete(key);
}

export async function fetchOnce(key, fetcher, ttlMs = 0) {
  const now = Date.now();
  const cached = cacheStore.get(key);

  if (cached && (ttlMs === 0 || now - cached.fetchedAt < ttlMs)) {
    if (cached.error) {
      throw cached.error;
    }
    return cached.value;
  }

  if (promiseStore.has(key)) {
    return promiseStore.get(key);
  }

  const promise = (async () => {
    try {
      const result = await fetcher();
      cacheStore.set(key, { value: result, fetchedAt: Date.now() });
      return result;
    } catch (err) {
      if (ttlMs > 0) {
        cacheStore.set(key, { error: err, fetchedAt: Date.now() });
      }
      throw err;
    } finally {
      promiseStore.delete(key);
    }
  })();

  promiseStore.set(key, promise);
  return promise;
}
