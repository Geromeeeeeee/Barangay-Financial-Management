import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get("token");

    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}reset_password.php`, { token, password });
            if (res.data.success) {
                setMsg("Password reset successfully! You can now log in.");
                setTimeout(() => navigate("/"), 3000); // Wait 3 seconds, then go to login
            } else {
                setError(res.data.message);
            }
        } catch {
            setError("Server error. Please try again.");
        }
    };

    return (
        <main className="auth-page">
            {/* 👇 Added the reset-layout class here */}
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