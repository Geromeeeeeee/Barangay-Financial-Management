import { useState } from "react";
import "../../styles/dashboard.css";
import "../../styles/staff_dashboard.css";
import ClearanceChart from "../../components/clearance_chart"; 
import {
    IconFile, IconClock, IconThumbsUp, IconChart,
    StatCard, DashboardHero, QuickAction
} from "../../components/dashboard_widgets";
import { useStaffStats } from "../../custom_hooks/use_staff_stats";
import ClearanceModal from "../../components/clearance_modal";
import ClearancePrint from "../../components/clearance_print";
import { Pencil } from "lucide-react";

export default function StaffDashboard({ user }) {
    const { stats, loading, error, refresh } = useStaffStats();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [printData, setPrintData] = useState(null);
    const [editData, setEditData] = useState(null);

    const handleOpenNew = () => {
        setEditData(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (clearance) => {
        setEditData(clearance);
        setIsModalOpen(true);
    };

    return (
        <div className="dashboard-page staff-view">
            {/* Top Section: Hero + Quick Actions */}
            <div className="top-split-layout">
                <div className="hero-wrapper">
                    <DashboardHero user={user} />
                </div>
                
                <div className="dash-card staff-quick-actions-card">
                    <div className="dash-card-head">
                        <h2>Quick Actions</h2>
                    </div>
                    <div className="quick-actions">
                        <button className="quick-action" onClick={handleOpenNew}>
                            <div className="qa-icon"><IconFile /></div>
                            <span className="qa-label">Issue New Clearance</span>
                        </button>
                        <QuickAction to="/ClearanceReport" Icon={IconChart} label="Generate Clearance Report" />
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Main Section: Recent Clearances (Full Width) */}
            <div className="dash-card" style={{ marginBottom: '24px' }}>
                <div className="dash-card-head">
                    <h2>Recent Clearances</h2>
                    <button className="dash-link" onClick={refresh}>Refresh</button>
                </div>

                {loading ? (
                    <p className="muted">Loading…</p>
                ) : stats.recentClearances.length === 0 ? (
                    <p className="muted">No clearances issued yet.</p>
                ) : (
                    <div className="staff-table-wrapper">
                        <table className="staff-table">
                            <thead>
                                <tr>
                                    <th>Resident</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentClearances.map((c) => (
                                    <tr key={c.id}>
                                        <td><strong>{c.resident_name}</strong></td>
                                        <td>{c.clearance_type}</td>
                                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-pill ${c.status === 'Issued' ? 'status-success' : 'status-warning'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    className="btn-outline" 
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    onClick={() => handleOpenEdit(c)}
                                                >
                                                    <Pencil size={12} /> Edit
                                                </button>
                                                {c.status === 'Issued' && (
                                                    <button 
                                                        className="btn-outline" 
                                                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        onClick={() => setPrintData(c)}
                                                    >
                                                        🖨️ Print
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ClearanceChart />

            <ClearanceModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={refresh} 
                editData={editData} 
            />

            {printData && (
                <ClearancePrint 
                    data={printData} 
                    onClose={() => setPrintData(null)} 
                />
            )}
        </div>
    );
}