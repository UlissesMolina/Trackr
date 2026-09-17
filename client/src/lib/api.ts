import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

let tokenGetter: (() => Promise<string | null>) | null = null;
let markTokenGetterReady: () => void;
const tokenGetterReady = new Promise<void>((resolve) => {
  markTokenGetterReady = resolve;
});

/**
 * Register the function used to fetch a fresh Clerk token for each request.
 * Requests made before this is called wait for it instead of going out
 * unauthenticated (child components can query before the layout's effect runs).
 */
export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
  markTokenGetterReady();
}

api.interceptors.request.use(async (config) => {
  await tokenGetterReady;
  const token = await tokenGetter?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
