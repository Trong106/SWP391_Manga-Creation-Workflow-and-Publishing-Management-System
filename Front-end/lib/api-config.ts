const isClient = typeof window !== "undefined";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (isClient
    ? `${window.location.protocol === "https:" ? "https" : "http"}://localhost:${window.location.protocol === "https:" ? "64111" : "64112"}`
    : "http://localhost:64112");

export async function readJson<T = unknown>(response: Response): Promise<T | null> {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  return JSON.parse(text) as T;
}

