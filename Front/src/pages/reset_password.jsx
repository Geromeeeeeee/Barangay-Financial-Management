import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../context/toast_context";
import "../styles/auth.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get("token");
    const { showToast } = useToast();

    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}reset_password.php`, { token, password });
            if (res.data.success) {
                setMsg("Password reset successfully! You can now log in.");
                showToast("Password reset successfully!", "success");
                setTimeout(() => navigate("/"), 3000);
            } else {
                setError(res.data.message);
                showToast(res.data.message || "Failed to reset password.", "error");
            }
        } catch {
            setError("Server error. Please try again.");
            showToast("Server error. Please try again.", "error");
        }
    };

    return (
        <main className="auth-page">
            <div className="auth-shell reset-layout">
                <div className="auth-form-side">
                    <div className="form-header">
                        <h1>Set New Password</h1>
                        {!msg && <p>Please enter your new password below.</p>}
                    </div>
                    
                    {msg && <div className="alert alert-success">{msg}</div>}
                    {error && <div className="alert alert-error">{error}</div>}
                    
                    {!msg && (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <label className="field">
                                <span>New Password</span>
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    required 
                                    minLength={6}
                                    placeholder="Enter new password"
                                />
                            </label>
                            <button type="submit" className="submit-button">Update Password</button>
                        </form>
                    )}
                </div>
            </div>
        </main>
    );
}