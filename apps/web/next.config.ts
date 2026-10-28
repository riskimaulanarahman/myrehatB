import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const withVarlock = varlockNextConfigPlugin();
import type { NextConfig } from "next";

// Docker/Dokploy: the API server is the `taskb14-api` compose service. The name must be unique
// because Dokploy puts every project on the shared dokploy-network.
// `next dev` runs outside Docker, where the API server listens on localhost:3000.
const PRODUCTION_API_SERVER = "http://taskb14-api:3000";
const DEV_API_SERVER = "http://localhost:3000";

const nextConfig = (phase: string): NextConfig => {
  const apiServer = phase === PHASE_DEVELOPMENT_SERVER ? DEV_API_SERVER : PRODUCTION_API_SERVER;

  return {
    typedRoutes: true,
    reactCompiler: true,
    output: "standalone",
    transpilePackages: ["shiki"],
    async rewrites() {
      return [
        { source: "/rpc", destination: `${apiServer}/rpc` },
        { source: "/rpc/:path*", destination: `${apiServer}/rpc/:path*` },
        { source: "/api/auth", destination: `${apiServer}/api/auth` },
        {
          source: "/api/auth/:path*",
          destination: `${apiServer}/api/auth/:path*`,
        },
      ];
    },
  };
};

export default withVarlock(nextConfig);
