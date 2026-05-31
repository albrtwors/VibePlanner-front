import { toast, ToastOptions } from "react-toastify";

const baseConfig: ToastOptions = {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
};

export const notify = {
    success: (message: string) => {
        toast.success(message, baseConfig);
    },

    error: (message: string) => {
        toast.error(message || "Ha ocurrido un error.", baseConfig);
    },

    warning: (message: string) => {
        toast.warn(message, baseConfig);
    },

    // 1. NUEVA FUNCIÓN PARA ESTADOS DE CARGA (LOADING)
    // Esta función RETORNA el ID de la alerta para que puedas controlarla después.
    loading: (message: string = "Procesando petición...") => {
        return toast.loading(message, {
            position: "top-right",
            theme: "dark",
        });
    },

    // 2. FUNCIÓN MÁGICA PARA CERRAR CUALQUIER ALERTA POR SU ID
    close: (toastId: string | number) => {
        toast.dismiss(toastId);
    }
};