import { useState, useEffect } from "react";
import '../styles/auth.css';
import useAuth from "../custom_hooks/use_auth";
import { useErr } from "../custom_hooks/use_err";
import { useStat } from "../custom_hooks/use_stat";
import { validateInviteCode } from "../custom_hooks/use_invite";
import sealLogo from "../assets/barangay-malagasang-logo.jpg";
import Splash_Screen from "../components/splash_screen";
import ForgotPasswordModal from "../components/forgot_password_modal";

function EyeIcon({ open }) {
    return open ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function PasswordField({ label, name, value, onChange, show, toggleShow }) {
    return (
        <label className="field">
            <span>{label}</span>
            <div className="password-wrap">
                <input
                    type={show ? "text" : "password"}
                    placeholder={`Enter your ${label.toLowerCase()}`}
                    required
                    name={name}
                    value={value}
                    onChange={onChange}
                />
                <button type="button" className="password-toggle" onClick={toggleShow}>
                    <EyeIcon open={show} />
                </button>
            </div>
        </label>
    );
}

function InviteCodeField({ code, setCode, status, message }) {
    return (
        <label className="field">
            <span>Invite code</span>
            <div className={`invite-wrap invite-${status || "idle"}`}>
                <input
                    type="text"
                    placeholder="MAL2A-XXXX-XXXX"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="invite-input"
                />
                {status === "checking" && <span className="invite-badge">Checking…</span>}
                {status === "valid" && <span className="invite-badge invite-valid">✓</span>}
                {status === "invalid" && <span className="invite-badge invite-invalid">✕</span>}
            </div>
            {message && <small className={`invite-msg invite-msg-${status}`}>{message}</small>}
        </label>
    );
}

// ======================== MAIN PAGE ========================

export default function Auth_Page() {
    const [isLogin, setIsLogin] = useState(true);
    const [stat, setStat] = useStat();
    const [err, setErr] = useErr();
    const [showSplash, setShowSplash] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [showForgot, setShowForgot] = useState(false);

    // Invite code state
    const [inviteCode, setInviteCode] = useState("");
    const [codeStatus, setCodeStatus] = useState(null);
    const [codeMessage, setCodeMessage] = useState("");

    const { handleSubmit, handleFormChange, accountDetails } = useAuth({
        isLogin, setErr, setStat, setIsLogin, inviteCode
    });

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 2200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!inviteCode || isLogin) {
            setCodeStatus(null);
            setCodeMessage("");
            return;
        }
        setCodeStatus("checking");
        const t = setTimeout(async () => {
            const res = await validateInviteCode(inviteCode.trim());
            if (res.valid) {
                setCodeStatus("valid");
                setCodeMessage(`Code valid for role: ${res.role}`);
            } else {
                setCodeStatus("invalid");
                setCodeMessage(res.message || "Invalid or expired code");
            }
        }, 500);
        return () => clearTimeout(t);
    }, [inviteCode, isLogin]);

    if (showSplash) return <Splash_Screen />;

    return (
        <main className="auth-page">
            <div className="auth-shell">
                
                {/* ===== LEFT: FORM ===== */}
                <div className="auth-form-side">
                    <div className="brand-mark">
                        <div className="brand-icon">
                            <img src={sealLogo} alt="Seal" className="brand-icon-img" />
                        </div>
                        <div>
                            <div className="brand-name">Barangay Malagasang II-A</div>
                            <div className="brand-sub">Management System</div>
                        </div>
                    </div>

                    <div className="form-header">
                        <h1>{isLogin ? "Welcome" : "Request an account"}</h1>
                        {!isLogin && <p>You'll need an invite code from your barangay administrator.</p>}
                    </div>

                    {err && <div className="alert alert-error">{err}</div>}
                    {stat && <div className="alert alert-success">{stat}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        
                        {!isLogin && (
                            <>
                                <InviteCodeField 
                                    code={inviteCode} setCode={setInviteCode} 
                                    status={codeStatus} message={codeMessage} 
                                />
                                <div className="field-row">
                                    <label className="field">
                                        <span>First name</span>
                                        <input type="text" placeholder="Juan" required name="firstName" value={accountDetails.firstName} onChange={handleFormChange} />
                                    </label>
                                    <label className="field">
                                        <span>Last name</span>
                                        <input type="text" placeholder="Dela Cruz" required name="lastName" value={accountDetails.lastName} onChange={handleFormChange} />
                                    </label>
                                </div>
                                <label className="field">
                                    <span>Email address</span>
                                    <input type="email" placeholder="juan@example.com" required name="email" value={accountDetails.email} onChange={handleFormChange} />
                                </label>
                            </>
                        )}

                        <label className="field">
                            <span>Username</span>
                            <input type="text" placeholder="Enter your username" required name="userName" value={accountDetails.userName} onChange={handleFormChange} />
                        </label>

                        <PasswordField 
                            label="Password" name="password" value={accountDetails.password} onChange={handleFormChange} 
                            show={showPassword} toggleShow={() => setShowPassword(!showPassword)} 
                        />

                        {!isLogin && (
                            <>
                                <PasswordField 
                                    label="Confirm password" name="confirmPass" value={accountDetails.confirmPass} onChange={handleFormChange} 
                                    show={showConfirmPass} toggleShow={() => setShowConfirmPass(!showConfirmPass)} 
                                />
                                <div className="info-note">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                    <span>Use the exact email address that received the invite code.</span>
                                </div>
                            </>
                        )}

                        {isLogin && (
                            <div className="form-extras">
                                <label className="checkbox">
                                    <input type="checkbox" />
                                    <span>Remember me</span>
                                </label>
                                <button type="button" className="forgot" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setShowForgot(true)}>
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button className="submit-button" type="submit" disabled={!isLogin && codeStatus !== "valid"}>
                            {isLogin ? "Sign in" : "Submit request"}
                        </button>

                        <p className="auth-switch">
                            {isLogin ? "Need access?" : "Already have an account?"}{" "}
                            <button type="button" className="link-btn" onClick={() => setIsLogin(!isLogin)}>
                                {isLogin ? "Request an account" : "Sign in"}
                            </button>
                        </p>
                    </form>
                </div>

                {/* ===== RIGHT: BRANDING ===== */}
                <aside className="auth-brand-side">
                    <div className="brand-side-content">
                        <div className="seal-wrap">
                            <img src={sealLogo} alt="Seal" className="seal-img" />
                        </div>
                        <h2 className="welcome-title">Maligayang pagdating, Kabarangay!</h2>
                        <p className="welcome-sub">Welcome to Barangay Malagasang II-A</p>
                        <div className="welcome-divider" />
                        <p className="welcome-text">
                            {isLogin
                                ? "Mag-sign in upang ma-access ang mga talaan ng pondo at serbisyo ng barangay."
                                : "Kailangan mo ng invite code mula sa barangay administrator upang makapagrehistro."}
                        </p>
                    </div>
                    <div className="brand-footer">City of Imus · Cavite</div>
                </aside>

            </div>
            
            {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
        </main>
    );
}