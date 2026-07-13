import type { NextConfig } from "next";

// Definimos la URL de Flask para desarrollo o producción de forma dinámica
const BACKEND_URL = "https://vibe-planner-back.vercel.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // El cliente pide a Next.js local
        source: "/api/:path*",
        // Next.js resuelve contra Flask de forma invisible para el navegador
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
  /* Si usas Webpack o Turbopack para SVGs, puedes mantener tus reglas aquí abajo */
};

export default nextConfig;