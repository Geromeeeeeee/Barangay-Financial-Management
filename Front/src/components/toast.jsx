import { useEffect } from "react";
import "../styles/toast.css";

export default function Toast({ message, type = "success", onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast-container toast-${type}`}>
            <div className="toast-icon">
                {type === "success" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                )}
            </div>
            <div className="toast-message">{message}</div>
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
    );
}