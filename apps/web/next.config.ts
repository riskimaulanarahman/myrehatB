import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";

const withVarlock = varlockNextConfigPlugin();
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  output: "standalone",
  transpilePackages: ["shiki"],
  async rewrites() {
    return [
      { source: "/rpc", destination: "http://server:3000/rpc" },
      { source: "/rpc/:path*", destination: "http://server:3000/rpc/:path*" },
      { source: "/api/auth", destination: "http://server:3000/api/auth" },
      {
        source: "/api/auth/:path*",
        destination: "http://server:3000/api/auth/:path*",
      },
    ];
  },
};

export default withVarlock(nextConfig);
