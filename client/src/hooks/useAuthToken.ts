import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setAuthInterceptor } from "../lib/api";

export function useAuthToken() {
  const { getToken } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ejectInterceptor = setAuthInterceptor(getToken);
    // Signal ready once the interceptor is installed
    setReady(true);
    return ejectInterceptor;
  }, [getToken]);

  return ready;
}
