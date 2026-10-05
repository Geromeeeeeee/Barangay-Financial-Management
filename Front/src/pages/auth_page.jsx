import { useState, useEffect } from "react";
import '../styles/auth.css';
import useAuth from "../custom_hooks/use_auth";
import { useErr } from "../custom_hooks/use_err";
import { useStat } from "../custom_hooks/use_stat";
import { validateInviteCode } from "../custom_hooks/use_invite";
import sealLogo from "../assets/barangay-salinas-logo.jpg";
import Splash_Screen from "../components/splash_screen";

function EyeIcon({ open }) {
    return open ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

export default function Auth_Page() {
    const [isLogin, setIsLogin] = useState(true);
    const [stat, setStat] = useStat();
    const [err, setErr] = useErr();
    const [showSplash, setShowSplash] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // ===== Invite code state =====
    const [inviteCode, setInviteCode] = useState("");
    const [codeStatus, setCodeStatus] = useState(null); // null | "checking" | "valid" | "invalid"
    const [codeMessage, setCodeMessage] = useState("");

    const { handleSubmit, handleFormChange, accountDetails } = useAuth({
        isLogin, setErr, setStat, setIsLogin, inviteCode
    });

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 2200);
        return () => clearTimeout(timer);
    }, []);

    // ===== Debounced invite code validation =====
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

    // ===== SPLASH SCREEN =====
    if (showSplash) {
        return <Splash_Screen/>
    }

    return (
        <main className="auth-page">
            <div className="auth-shell">

                <div className="auth-form-side">
                    <div className="brand-mark">
                        <div className="brand-icon">
                            <img src={sealLogo} alt="Barangay Salinas 1 Seal" className="brand-icon-img" />
                        </div>
                        <div>
                            <div className="brand-name">Barangay Financial</div>
                            <div className="brand-sub">Management System</div>
                        </div>
                    </div>

                    <div className="form-header">
                        <h1>{isLogin ? "Welcome back" : "Request an account"}</h1>
                        <p>
                            {isLogin
                                ? "Sign in to access your barangay dashboard."
                                : "You'll need an invite code from your barangay administrator."}
                        </p>
                    </div>

                    {err && <div className="alert alert-error">{err}</div>}
                    {stat && <div className="alert alert-success">{stat}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">

                        {!isLogin && (
                            <>
                                {/* ===== Invite code field ===== */}
                                <label className="field">
                                    <span>Invite code</span>
                                    <div className={`invite-wrap invite-${codeStatus || "idle"}`}>
                                        <input
                                            type="text"
                                            placeholder="SAL1-XXXX-XXXX"
                                            required
                                            value={inviteCode}
                                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                            className="invite-input"
                                        />
                                        {codeStatus === "checking" && <span className="invite-badge">Checking…</span>}
                                        {codeStatus === "valid" && <span className="invite-badge invite-valid">✓</span>}
                                        {codeStatus === "invalid" && <span className="invite-badge invite-invalid">✕</span>}
                                    </div>
                                    {codeMessage && (
                                        <small className={`invite-msg invite-msg-${codeStatus}`}>
                                            {codeMessage}
                                        </small>
                                    )}
                                </label>

                                <div className="field-row">
                                    <label className="field">
                                        <span>First name</span>
                                        <input type="text" placeholder="Juan" required
                                            name="firstName" value={accountDetails.firstName}
                                            onChange={handleFormChange} />
                                    </label>
                                    <label className="field">
                                        <span>Last name</span>
                                        <input type="text" placeholder="Dela Cruz" required
                                            name="lastName" value={accountDetails.lastName}
                                            onChange={handleFormChange} />
                                    </label>
                                </div>

                                <label className="field">
                                    <span>Email address</span>
                                    <input type="email" placeholder="juan@example.com" required
                                        name="email" value={accountDetails.email}
                                        onChange={handleFormChange} />
                                </label>
                            </>
                        )}

                        <label className="field">
                            <span>Username</span>
                            <input type="text" placeholder="Enter your username" required
                                name="userName" value={accountDetails.userName}
                                onChange={handleFormChange} />
                        </label>

                        <label className="field">
                            <span>Password</span>
                            <div className="password-wrap">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    required
                                    name="password"
                                    value={accountDetails.password}
                                    onChange={handleFormChange}
                                />
                                <button type="button" className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}>
                                    <EyeIcon open={showPassword} />
                                </button>
                            </div>
                        </label>

                        {!isLogin && (
                            <>
                                <label className="field">
                                    <span>Confirm password</span>
                                    <div className="password-wrap">
                                        <input
                                            type={showConfirmPass ? "text" : "password"}
                                            placeholder="Re-enter your password"
                                            required
                                            name="confirmPass"
                                            value={accountDetails.confirmPass}
                                            onChange={handleFormChange}
                                        />
                                        <button type="button" className="password-toggle"
                                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                                            aria-label={showConfirmPass ? "Hide password" : "Show password"}>
                                            <EyeIcon open={showConfirmPass} />
                                        </button>
                                    </div>
                                </label>

                                <div className="info-note">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                    <span>Your request will be reviewed by an admin before you can sign in.</span>
                                </div>
                            </>
                        )}

                        {isLogin && (
                            <div className="form-extras">
                                <label className="checkbox">
                                    <input type="checkbox" />
                                    <span>Remember me</span>
                                </label>
                                <a className="forgot" href="#forgot-password">Forgot password?</a>
                            </div>
                        )}

                        <button
                            className="submit-button"
                            type="submit"
                            disabled={!isLogin && codeStatus !== "valid"}
                        >
                            {isLogin ? "Sign in" : "Submit request"}
                        </button>

                        <p className="auth-switch">
                            {isLogin ? "Need access?" : "Already have an account?"}{" "}
                            <button type="button" className="link-btn"
                                onClick={() => setIsLogin(!isLogin)}>
                                {isLogin ? "Request an account" : "Sign in"}
                            </button>
                        </p>
                    </form>
                </div>

                <aside className="auth-brand-side">
                    <div className="brand-side-content">
                        <div className="seal-wrap">
                            <img src={sealLogo} alt="Barangay Salinas 1 Seal" className="seal-img" />
                        </div>
                        <h2 className="welcome-title">Maligayang pagdating, Kabarangay!</h2>
                        <p className="welcome-sub">Welcome to Barangay Salinas 1</p>
                        <div className="welcome-divider" />
                        <p className="welcome-text">
                            {isLogin
                                ? "Mag-sign in upang ma-access ang mga talaan ng pondo at serbisyo ng barangay."
                                : "Kailangan mo ng invite code mula sa barangay administrator upang makapagrehistro."}
                        </p>
                    </div>
                    <div className="brand-footer">City of Bacoor · Cavite</div>
                </aside>

            </div>
        </main>
    );
}