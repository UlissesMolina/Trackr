import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setAuthToken } from "../lib/api";

export function useAuthToken() {
  const { getToken } = useAuth();

  useEffect(() => {
    const interval = setInterval(async () => {
      const token = await getToken();
      setAuthToken(token);
    }, 50_000);

    getToken().then(setAuthToken);

    return () => clearInterval(interval);
  }, [getToken]);
}
