import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import BackButton from "../../components/back_button";
import "../../styles/admin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";
const BASE_URL = "http://localhost/Capstone/Back/";

export default function AuditTrail() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAction, setFilterAction] = useState("All");
    const [viewFile, setViewFile] = useState(null);

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

    const getPillColor = (action) => {
        if (action.includes("Revenue")) return "pill-green";
        if (action.includes("Expenditure")) return "pill-red";
        if (action.includes("Clearance")) return "pill-blue";
        if (action.includes("Sign Up")) return "pill-purple";
        return "pill-grey";
    };

    const uniqueActions = ["All", ...new Set(logs.map(log => log.action))];

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesAction = filterAction === "All" || log.action === filterAction;
            const matchesSearch = 
                log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesAction && matchesSearch;
        });
    }, [logs, filterAction, searchTerm]);

    return (
        <div className="admin-page">
            <BackButton />

            <header className="audit-header">
                <div>
                    <h1>Audit Trail</h1>
                    <p>Record of recent actions performed in the system.</p>
                </div>
                <button className="audit-refresh-btn" onClick={fetchLogs}>
                    Refresh
                </button>
            </header>

            <div className="audit-controls">
                <div className="audit-search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Search by user or details..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="audit-filter">
                    <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>{action}</option>
                        ))}
                    </select>
                </div>
            </div>

            <section className="audit-card">
                {loading && <p style={{ padding: '20px' }}>Loading logs...</p>}
                
                {!loading && filteredLogs.length === 0 && <p className="muted" style={{ padding: '20px' }}>No logs match your filter.</p>}

                {!loading && filteredLogs.length > 0 && (
                    <table className="audit-table">
                        <thead>
                            <tr>
                                <th>User / Date</th>
                                <th>Action</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => (
                                <tr key={log.id}>
                                    <td>
                                        <div className="audit-user">
                                            <strong>{log.username}</strong>
                                            <span>{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`audit-pill ${getPillColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="audit-details">
                                        <div>{log.details}</div>
                                        {log.attachment_count > 0 && (
                                            <div className="audit-attachments">
                                                <span>
                                                    {log.attachment_count} attachment{log.attachment_count === 1 ? "" : "s"}
                                                </span>
                                                {log.attachment_paths.map((path, index) => (
                                                    <button
                                                        key={`${log.id}-${path}`}
                                                        onClick={() => setViewFile(`${BASE_URL}endpoints/view_file.php?file=${encodeURIComponent(path)}`)}
                                                        className="audit-file-link"
                                                    >
                                                        🔍 View {log.attachment_count > 1 ? index + 1 : ""}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {viewFile && (
                <div className="logout-modal-backdrop" onClick={() => setViewFile(null)}>
                    <div className="logout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}> Attachment</h3>
                            <button className="btn-outline" onClick={() => setViewFile(null)} style={{ padding: '6px 12px' }}> ✕ Close</button>
                        </div>
                        
                        {viewFile.toLowerCase().includes('.pdf') ? (
                            <iframe src={viewFile} width="100%" height="600px" style={{ border: 'none', borderRadius: '8px' }} title="Receipt PDF" />
                        ) : (
                            <img src={viewFile} alt="Receipt" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}