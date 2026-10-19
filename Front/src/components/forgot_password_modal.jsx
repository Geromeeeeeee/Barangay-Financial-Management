import { useState } from "react";
import axios from "axios";
import "../styles/auth.css"; // 👈 Fixed the path (removed one dot)

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function ForgotPasswordModal({ onClose }) {
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}request_reset.php`, { email });
            setMsg(res.data.message);
        } catch {
            setMsg("Failed to send email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="logout-modal-backdrop" onClick={onClose}>
            <div className="logout-modal" onClick={e => e.stopPropagation()}>
                <h3>Reset Password</h3>
                <p>Enter your email address and we'll send you a link to reset your password.</p>

                {msg && <div className="alert alert-success">{msg}</div>}

                {!msg && (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <label className="field">
                            <span>Email Address</span>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required 
                            />
                        </label>
                        <div className="logout-modal-actions">
                            <button type="button" className="logout-modal-cancel" onClick={onClose}>Cancel</button>
                            <button type="submit" className="submit-button" disabled={loading}>
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}