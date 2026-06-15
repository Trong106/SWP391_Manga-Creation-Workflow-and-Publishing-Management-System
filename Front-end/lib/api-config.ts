const isClient = typeof window !== "undefined";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (isClient
    ? `${window.location.protocol}//${window.location.hostname}:${window.location.protocol === "https:" ? "64111" : "64112"}`
    : "http://localhost:64112");

