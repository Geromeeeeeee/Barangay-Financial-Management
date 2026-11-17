import { useState, useRef, useEffect } from "react";
import BackButton from "../../components/back_button";
import { useInvite } from "../../custom_hooks/use_invite";
import { useDashboardStats } from "../../custom_hooks/use_dashboard_stats";
import { IconUsers, IconTicket, StatCard } from "../../components/dashboard_widgets";
import "../../styles/admin.css";

export default function InviteCodesPage() {
    const { codes, loading, error, success, generateCode, revokeCode } = useInvite();
    const { stats, loading: statsLoading } = useDashboardStats();
    
    const [role, setRole] = useState("staff");
    const [email, setEmail] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const EXPIRATION_HOURS = 24;

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleGenerate = (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        generateCode(role, email.trim(), EXPIRATION_HOURS);
        setEmail("");
    };

    const handleResend = async (oldCode) => {
        if (!window.confirm(`Resend a new invite to ${oldCode.email}? The previous code will be invalidated.`)) return;
        
        await revokeCode(oldCode.id);
        generateCode(oldCode.role, oldCode.email, EXPIRATION_HOURS);
    };

    const copy = (code) => navigator.clipboard.writeText(code);

    const isRoleDisabled = (roleName) => {
        const uniqueRoles = ['treasurer', 'sk_chairman', 'admin'];
        if (!uniqueRoles.includes(roleName)) return false;

        if (!codes) return false;
        
        const normalize = (str) => str.toLowerCase().replace(/[\s_]+/g, '');
        const targetRole = normalize(roleName);

        return codes.some(c => 
            normalize(c.role) === targetRole && 
            !c.usedBy && 
            new Date(c.expiresAt) > new Date()
        );
    };

    const rolesList = [
        { id: "staff", label: "Staff" },
        { id: "treasurer", label: "Treasurer" },
        { id: "admin", label: "Admin" },
        { id: "sk_chairman", label: "SK Chairman" },
        { id: "sk_member", label: "SK Member" }
    ];

    const ErrorAlert = ({ message }) => {
        if (!message) return null;
        
        if (message.includes("Security Block:") || message.includes("Email Block:")) {
            let title = "Action Denied";
            let desc = message.replace(/Security Block:|Email Block:/g, "").trim();
            
            if (message.includes("Security Block:")) {
                const rawRole = message.split("'")[1] || "this role";
                const formattedRole = rawRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                title = "Role Already Assigned";
                desc = `An active account for ${formattedRole} already exists.`;
            } 
            else if (message.includes("Email Block:")) {
                title = "Email Already Registered";
            }

            return (
                <div className="security-alert">
                    <span className="security-alert-icon">⚠️</span>
                    <div className="security-alert-content">
                        <strong>{title}</strong>
                        <span>{desc}</span>
                    </div>
                </div>
            );
        }
        
        return <div className="alert alert-error">{message}</div>;
    };

    return (
        <div className="admin-page">
            <BackButton />

            <header className="admin-header">
                <h1>Invite Codes</h1>
                <p>Generate one-time codes and send them to a specific email address.</p>
            </header>

            <section className="stat-grid" style={{ marginBottom: '24px' }}>
                <StatCard Icon={IconUsers} label="Total Users" value={statsLoading ? "…" : stats.totalUsers} trend="Registered accounts" accent="blue" />
                <StatCard Icon={IconTicket} label="Active Invite Codes" value={statsLoading ? "…" : stats.activeCodes} trend="Valid & unused" accent="amber" />
            </section>

            <ErrorAlert message={error} />
            
            {success && <div className="alert alert-success">{success}</div>}

            <section className="admin-card">
                <h2>Generate a new code</h2>
                <form className="invite-form" onSubmit={handleGenerate}>
                    <label style={{ flex: 1, minWidth: '250px' }}>
                        Email address
                        <input 
                            type="email" 
                            placeholder="name@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </label>
                    
                    <label className="custom-dropdown-container" ref={dropdownRef}>
                        Role
                        <div 
                            className="custom-dropdown-trigger"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            {rolesList.find(r => r.id === role)?.label}
                            <span style={{ fontSize: '10px', color: '#6b7280' }}>▼</span>
                        </div>

                        {isDropdownOpen && (
                            <div className="custom-dropdown-menu">
                                {rolesList.map((r) => {
                                    const disabled = isRoleDisabled(r.id);
                                    return (
                                        <div
                                            key={r.id}
                                            className={`custom-dropdown-item ${disabled ? 'disabled' : ''} ${role === r.id ? 'active' : ''}`}
                                            onClick={() => {
                                                if (!disabled) {
                                                    setRole(r.id);
                                                    setIsDropdownOpen(false);
                                                }
                                            }}
                                        >
                                            {r.label}
                                            {disabled && (
                                                <span className="dropdown-warning-text">🚫 Already Active</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </label>

                    <label style={{ width: '130px' }}>
                        Expires in (hours)
                        <input 
                            type="number" 
                            value={EXPIRATION_HOURS} 
                            readOnly 
                            style={{ 
                                cursor: 'not-allowed', 
                                opacity: 0.7, 
                                width: '100%',
                                textAlign: 'center',
                                boxSizing: 'border-box'
                            }}
                        />
                    </label>

                    <button type="submit" className="btn-primary" disabled={isRoleDisabled(role)}>
                        Generate
                    </button>
                </form>
            </section>

            <section className="admin-card">
                <h2>Active codes</h2>
                {loading && <p>Loading…</p>}
                {!loading && codes.length === 0 && <p className="muted">No codes yet.</p>}
                {!loading && codes.length > 0 && (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Sent to (Email)</th>
                                <th>Role</th>
                                <th>Expires</th>
                                <th>Used</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {codes.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <code className="code-pill">{c.code}</code>
                                        <button type="button" className="link-btn" onClick={() => copy(c.code)}>copy</button>
                                    </td>
                                    <td>{c.email || "—"}</td>
                                    <td>{c.role}</td>
                                    <td>{new Date(c.expiresAt).toLocaleString()}</td>
                                    <td>{c.usedBy ? "Yes" : "No"}</td>
                                    <td>
                                        {!c.usedBy && (
                                            <button 
                                                type="button" 
                                                className="btn-primary" 
                                                style={{ padding: '6px 12px', fontSize: '0.75rem', marginRight: '8px' }}
                                                onClick={() => handleResend(c)}
                                            >
                                                Resend
                                            </button>
                                        )}
                                        <button type="button" className="btn-danger" onClick={() => revokeCode(c.id)}>
                                            Revoke
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}