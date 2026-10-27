import { useProjects } from "../../custom_hooks/use_projects";
import BackButton from "../../components/back_button";
import "../../styles/admin.css";

export default function ProjectsPage() {
    const { projects, loading, updateStatus } = useProjects();

    const formatPeso = (n) => "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });

    return (
        <div className="admin-page">
            {/* 👇 ADDED BACK BUTTON HERE */}
            <BackButton />

            <header className="admin-header">
                <h1>Project Requests</h1>
                <p>Review and approve budget requests from the SK and Staff.</p>
            </header>

            <section className="admin-card">
                {loading ? <p>Loading…</p> : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Project Title</th>
                                <th>Requested By</th>
                                <th>Est. Cost</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <strong>{p.title}</strong><br/>
                                        <span className="muted" style={{fontSize: "0.8rem"}}>{p.description}</span>
                                    </td>
                                    <td>{p.first_name} {p.last_name}</td>
                                    <td>{formatPeso(p.estimated_cost)}</td>
                                    <td>
                                        <span className={`role-badge role-${p.status === 'approved' ? 'staff' : p.status === 'rejected' ? 'admin' : 'treasurer'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="action-cell">
                                        {p.status === 'pending' && (
                                            <>
                                                <button className="btn-primary" onClick={() => updateStatus(p.id, 'approved')}>Approve</button>
                                                <button className="btn-danger" onClick={() => updateStatus(p.id, 'rejected')}>Reject</button>
                                            </>
                                        )}
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