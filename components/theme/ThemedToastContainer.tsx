"use client";

import { ToastContainer } from "react-toastify";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ThemedToastContainer() {
    const { theme } = useTheme();
    return (
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
            theme={theme}
        />
    );
}
