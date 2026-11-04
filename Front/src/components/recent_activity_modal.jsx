import { ActivityRow } from "./dashboard_widgets";
import refreshIcon from "../assets/refresh.svg";
import "../styles/dashboard.css";

function timeAgo(dateString) {
    if (!dateString) return "";
    const then = new Date(dateString.replace(" ", "T")).getTime();
    const now = Date.now();
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

    return new Date(dateString).toLocaleDateString("en-PH", {
        month: "short", day: "numeric", year: "numeric",
    });
}

export default function RecentActivityModal({ isOpen, onClose, activityType, selectedActivity, refresh, loading }) {
    if (!isOpen) return null;

    return (
        <div className="logout-modal-backdrop" onClick={onClose}>
            <div className="logout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', padding: '32px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        All {activityType === "revenue" ? "Recent Revenue" : "Recent Expenditures"}
                    </h2>
                    
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <button 
                            className="dash-link refresh-button" 
                            onClick={refresh} 
                            disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#2563eb', fontWeight: '600' }}
                        >
                            <img src={refreshIcon} alt="" style={{ width: '16px', height: '16px' }} />
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                        
                        <button 
                            className="btn-outline" 
                            onClick={onClose}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Close
                        </button>
                    </div>
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
                    {loading ? (
                        <p className="muted">Loading...</p>
                    ) : selectedActivity.length === 0 ? (
                        <p className="muted">No recent activity found.</p>
                    ) : (
                        <ul className="activity-list">
                            {selectedActivity.map((row) => (
                                <ActivityRow
                                    key={`modal-${activityType}-${row.id}`}
                                    dot={activityType === "revenue" ? "green" : "red"}
                                    title={activityType === "revenue" ? row.source : `Expenditure: ${row.description}`}
                                    meta={`₱${Number(row.amount).toLocaleString()}`}
                                    time={timeAgo(row.created_at)}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}