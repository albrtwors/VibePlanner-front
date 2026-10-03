import type { NextConfig } from "next";

// Definimos la URL de Flask para desarrollo o producción de forma dinámica.
// - BACKEND_URL en el entorno (archivo .env.local) tiene prioridad.
// - En desarrollo sin configurar, pegamos contra el Flask local.
// - En producción se usa el deploy de Vercel.
const PROD_BACKEND_URL = "https://vibe-planner-back.vercel.app";
const BACKEND_URL =
  process.env.BACKEND_URL ??
  (process.env.NODE_ENV === "production" ? PROD_BACKEND_URL : "http://localhost:5000");

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