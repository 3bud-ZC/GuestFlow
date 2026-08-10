export function memoizePerRequest<T>(fn: () => Promise<T>): () => Promise<T> {
  const cache = new Map<string, Promise<T>>();
  return () => {
    const key = 'request';
    if (!cache.has(key)) {
      cache.set(key, fn());
    }
    return cache.get(key)!;
  };
}
