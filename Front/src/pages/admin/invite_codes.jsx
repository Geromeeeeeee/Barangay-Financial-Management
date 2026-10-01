import { useState } from "react";
import { useInvite } from "../../custom_hooks/use_invite";
import "../../styles/admin.css";

export default function InviteCodesPage() {
    const { codes, loading, error, success, generateCode, revokeCode } = useInvite();
    const [role, setRole] = useState("staff");
    const [hours, setHours] = useState(24);

    const handleGenerate = () => generateCode(role, Number(hours));
    const copy = (code) => navigator.clipboard.writeText(code);

    return (
        <div className="admin-page">
            <header className="admin-header">
                <h1>Invite Codes</h1>
                <p>Generate one-time codes to onboard new staff, treasurers, or admins.</p>
            </header>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <section className="admin-card">
                <h2>Generate a new code</h2>
                <div className="invite-form">
                    <label>
                        Role
                        <select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="staff">Staff</option>
                            <option value="treasurer">Treasurer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </label>
                    <label>
                        Expires in (hours)
                        <input type="number" min="1" max="168"
                            value={hours} onChange={(e) => setHours(e.target.value)} />
                    </label>
                    <button className="btn-primary" onClick={handleGenerate}>Generate</button>
                </div>
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
                                        <button className="link-btn" onClick={() => copy(c.code)}>copy</button>
                                    </td>
                                    <td>{c.role}</td>
                                    <td>{new Date(c.expiresAt).toLocaleString()}</td>
                                    <td>{c.usedBy ? "Yes" : "No"}</td>
                                    <td>
                                        <button className="btn-danger" onClick={() => revokeCode(c.id)}>
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