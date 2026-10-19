import type { Metadata } from "next";
import "./globals.css"; // Asegúrate de importar tus estilos globales
import Navbar from "@/components/navbar/Navbar";
import RouteGuard from "@/components/auth/RouteGuard";
import ThemedToastContainer from "@/components/theme/ThemedToastContainer";
import { ThemeProvider, THEME_STORAGE_KEY } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "VibePlanner - AI Event Coordinator",
  description: "Coordinación inteligente de eventos musicales y religiosos",
};

// Aplica el tema guardado ANTES de la hidratación para evitar un flash de estilo.
const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"){document.documentElement.classList.remove("dark");}else{document.documentElement.classList.add("dark");}}catch(e){document.documentElement.classList.add("dark");}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: el script inline puede tocar className del <html> antes de React.
    <html lang="es" suppressHydrationWarning className="h-full antialiased selection:bg-indigo-500 selection:text-white">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
        <ThemeProvider>
          {/* --- NAVBAR BONITO --- */}
          <Navbar></Navbar>

          {/* --- CONTENIDO PRINCIPAL --- */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <RouteGuard>{children}</RouteGuard>
          </main>

          {/* --- FOOTER SENCILLO --- */}
          <footer className="w-full border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 dark:border-slate-900 dark:bg-slate-950">
            <p>&copy; {new Date().getFullYear()} VibePlanner. Inteligencia Artificial para tus comunidades espirituales y musicales.</p>
          </footer>
          <ThemedToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}