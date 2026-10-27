import { useNavigate } from "react-router-dom";

export default function BackButton({ fallbackPath = "/Dashboard" }) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1); 
        } else {
            navigate(fallbackPath); 
        }
    };

    return (
        <button 
            onClick={handleBack} 
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "0.9rem",
                fontWeight: "600",
                cursor: "pointer",
                padding: "8px 0",
                marginBottom: "16px",
                transition: "color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.color = "#166534"}
            onMouseOut={(e) => e.currentTarget.style.color = "#64748b"}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Dashboard
        </button>
    );
}