import type { Metadata } from "next";
import "./globals.css"; // Asegúrate de importar tus estilos globales
import Navbar from "@/components/navbar/Navbar";
import { ToastContainer } from "react-toastify";

export const metadata: Metadata = {
  title: "VibePlanner - AI Event Coordinator",
  description: "Coordinación inteligente de eventos musicales y religiosos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased selection:bg-indigo-500 selection:text-white">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">

        {/* --- NAVBAR BONITO --- */}
        <Navbar></Navbar>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* --- FOOTER SENCILLO --- */}
        <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} VibePlanner. Inteligencia Artificial para tus comunidades espirituales y musicales.</p>
        </footer>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark" // <-- Combina perfecto con tu estética oscura
        />
      </body>
    </html>
  );
}