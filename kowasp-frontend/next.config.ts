import type { NextConfig } from "next";
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const nextConfig: NextConfig = {
  /* config options here */
};


if (process.env.NODE_ENV === 'development') {
  (async () => {
    await setupDevPlatform();
  })();
}

export default nextConfig;
