import { createContext, useContext, useState } from "react";
import Toast from "../components/toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
    };

    const hideToast = () => {
        setToast(null);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={hideToast} 
                />
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}