import { useState, useEffect } from "react";
import axios from "axios";
import BackButton from "../../components/back_button";
import "../../styles/admin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function AuditTrail() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = () => {
        setLoading(true);
        axios.get(`${API_URL}admin/get_audit_logs.php`, { withCredentials: true })
            .then(res => {
                if (Array.isArray(res.data)) {
                    setLogs(res.data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="admin-page">
            <BackButton />

            <header className="admin-header">
                <div>
                    <h1>Audit Trail</h1>
                    <p>Record of recent actions performed in the system.</p>
                </div>
                <button className="btn-primary" onClick={fetchLogs}>Refresh</button>
            </header>

            <section className="admin-card">
                {loading && <p>Loading logs...</p>}
                
                {!loading && logs.length === 0 && <p className="muted">No activity recorded yet.</p>}

                {!loading && logs.length > 0 && (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td><strong>{log.username}</strong></td>
                                    <td>
                                        <span className="code-pill">{log.action}</span>
                                    </td>
                                    <td>{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}