import { createAuthClient } from "better-auth/react";

function getServerUrl(url: string) {
  // Browser: stay on the web origin; Next.js rewrites /api/auth to the API server.
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const processEnv = typeof process === "undefined" ? undefined : process.env;
  if (typeof window === "undefined" && processEnv?.SERVER_URL) {
    return processEnv.SERVER_URL.endsWith("/")
      ? processEnv.SERVER_URL.slice(0, -1)
      : processEnv.SERVER_URL;
  }

  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const authClient = createAuthClient({
  baseURL: new URL("/api/auth", getServerUrl(process.env.NEXT_PUBLIC_SERVER_URL!)).toString(),
});
