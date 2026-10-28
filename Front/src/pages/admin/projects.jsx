import { useState } from "react";
import { useProjects } from "../../custom_hooks/use_projects";
import BackButton from "../../components/back_button";
import "../../styles/admin.css";

export default function ProjectsPage() {
    const { projects, loading, updateStatus } = useProjects();
    const [error, setError] = useState("");

    const formatPeso = (n) => "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });
    const displayStatus = (status) => status === 'rejected' ? 'Declined' : status.charAt(0).toUpperCase() + status.slice(1);

    const handleStatus = async (id, status) => {
        setError("");
        try {
            await updateStatus(id, status);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "The fund request could not be updated.");
        }
    };

    return (
        <div className="admin-page">
            {/* 👇 ADDED BACK BUTTON HERE */}
            <BackButton />

            <header className="admin-header">
                <h1>Project Requests</h1>
                <p>Review and approve fund requests submitted by the SK Chair.</p>
            </header>

            {error && <div className="alert alert-error">{error}</div>}
            <section className="admin-card">
                {loading ? <p>Loading…</p> : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Project Title</th>
                                <th>Requested By</th>
                                <th>Est. Cost</th>
                                <th>Status</th>
                                <th>Supporting Documents</th>
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
                                        <span className={`role-badge role-${p.status === 'approved' ? 'staff' : p.status === 'declined' || p.status === 'rejected' ? 'admin' : 'treasurer'}`}>
                                            {displayStatus(p.status)}
                                        </span>
                                    </td>
                                    <td>
                                        {(p.attachments || []).length === 0 ? <span className="muted">None</span> : (
                                            <ul className="project-attachments">
                                                {p.attachments.map((attachment) => (
                                                    <li key={attachment.id}>
                                                        <a
                                                            href={`${import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/"}projects/download_attachment.php?id=${attachment.id}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            {attachment.file_name}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </td>
                                    <td className="action-cell">
                                        {p.status === 'pending' && (
                                            <>
                                                <button className="btn-primary" onClick={() => handleStatus(p.id, 'approved')}>Approve</button>
                                                <button className="btn-danger" onClick={() => handleStatus(p.id, 'declined')}>Decline</button>
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