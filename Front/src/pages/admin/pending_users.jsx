import { usePendingUsers } from "../../custom_hooks/use_pending_users";
import "../../styles/admin.css";

export default function PendingUsersPage() {
    const { users, loading, error, success, approve, reject } = usePendingUsers();

    return (
        <div className="admin-page">
            <header className="admin-header">
                <h1>Pending Account Requests</h1>
                <p>Approve to activate these accounts.</p>
            </header>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <section className="admin-card">
                {loading && <p>Loading…</p>}
                {!loading && users.length === 0 && <p className="muted">No pending requests. 🎉</p>}
                {!loading && users.length > 0 && (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Requested</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.firstName} {u.lastName}</td>
                                    <td>{u.userName}</td>
                                    <td>{u.email}</td>
                                    <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                                    <td>{new Date(u.createdAt).toLocaleString()}</td>
                                    <td className="action-cell">
                                        <button className="btn-primary" onClick={() => approve(u.id)}>Approve</button>
                                        <button className="btn-danger" onClick={() => reject(u.id)}>Reject</button>
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