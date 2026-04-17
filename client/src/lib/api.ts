import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

/**
 * Install a request interceptor that fetches a fresh Clerk token
 * for every outgoing request. Returns a cleanup function that
 * ejects the interceptor.
 */
export function setAuthInterceptor(
  getToken: () => Promise<string | null>
): () => void {
  const id = api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return () => api.interceptors.request.eject(id);
}

export default api;
