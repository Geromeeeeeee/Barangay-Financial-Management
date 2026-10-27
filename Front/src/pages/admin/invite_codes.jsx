import { useState } from "react";
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
    const [hours, setHours] = useState(24);

    const handleGenerate = (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        generateCode(role, email.trim(), Number(hours));
        setEmail("");
    };

    const copy = (code) => navigator.clipboard.writeText(code);

    return (
        <div className="admin-page">
            <BackButton />

            <header className="admin-header">
                <h1>Invite Codes</h1>
                <p>Generate one-time codes and send them to a specific email address.</p>
            </header>

            <section className="stat-grid" style={{ marginBottom: '24px' }}>
                <StatCard
                    Icon={IconUsers}
                    label="Total Users"
                    value={statsLoading ? "…" : stats.totalUsers}
                    trend="Registered accounts"
                    accent="blue"
                />
                <StatCard
                    Icon={IconTicket}
                    label="Active Invite Codes"
                    value={statsLoading ? "…" : stats.activeCodes}
                    trend="Valid & unused"
                    accent="amber"
                />
            </section>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <section className="admin-card">
                <h2>Generate a new code</h2>
                <form className="invite-form" onSubmit={handleGenerate}>
                    <label>
                        Email address
                        <input 
                            type="email" 
                            placeholder="name@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </label>
                    <label>
                        Role
                        <select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="staff">Staff</option>
                            <option value="treasurer">Treasurer</option>
                            <option value="admin">Admin</option>
                            <option value="sk_chairman">SK Chairman</option>
                            <option value="sk_member">SK Member</option>
                        </select>
                    </label>
                    <label>
                        Expires in (hours)
                        <input type="number" min="1" max="168"
                            value={hours} onChange={(e) => setHours(e.target.value)} />
                    </label>
                    <button type="submit" className="btn-primary">Generate</button>
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