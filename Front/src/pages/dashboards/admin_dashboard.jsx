import { useState } from "react";
import "../../styles/dashboard.css";
import "../../styles/admin_dashboard.css";
import DashboardChart from "../../components/dashboard_chart";
import eyeOpenIcon from "../../assets/eye_open.svg";
import eyeCloseIcon from "../../assets/eye_close.svg";
import {
    IconUsers, IconTicket,
    StatCard, QuickAction, DashboardHero,
} from "../../components/dashboard_widgets";
import { useDashboardStats } from "../../custom_hooks/use_dashboard_stats";
import RecentActivity from "../../components/recent_activity";

export default function AdminDashboard({ user }) {
    const { stats, loading, error, refresh } = useDashboardStats();
    const [activityType, setActivityType] = useState("revenue");
    
    const [showBalances, setShowBalances] = useState(true);
    const [hiddenCategories, setHiddenCategories] = useState({});

    const toggleCategory = (id) => {
        setHiddenCategories(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const selectedActivity = activityType === "revenue"
        ? stats.recentActivity.slice(0, 2)
        : stats.recentExpenditures?.slice(0, 2) || [];

    const getCategoryStatus = (percentage) => {
        if (percentage >= 75) return "Critical";
        if (percentage >= 50) return "Warning";
        if (percentage >= 20) return "Good";
        return "Excellent";
    };

    return (
        <div className="dashboard-page admin-view">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="top-split-layout">
                <div className="hero-wrapper">
                    <DashboardHero user={user} />
                </div>

                <RecentActivity activityType={activityType} refresh={refresh} loading={loading} selectedActivity={selectedActivity} setActivityType={setActivityType}/>
            </div>

            <section className="stat-grid">
                <StatCard Icon="₱" label="Total Revenue" value={loading ? "…" : (showBalances ? formatPeso(stats.totalRevenue) : "***")} trend="All time collection" accent="green" />
                <StatCard Icon="₱" label="Annual Income" value={loading ? "…" : (showBalances ? formatPeso(stats.totalAnnualIncome) : "***")} trend="NTA + Local Income" accent="blue" />
                <StatCard Icon="₱" label="Total Allocated" value={loading ? "…" : (showBalances ? formatPeso(stats.totalAllocated) : "***")} trend="All major categories" accent="purple" />
                <StatCard Icon="₱" label="Total Expenditures" value={loading ? "…" : (showBalances ? formatPeso(stats.totalExpenditures) : "***")} trend="Recorded spending" accent="red" />
                <StatCard Icon="₱" label="Total Remaining" value={loading ? "…" : (showBalances ? formatPeso(stats.totalRemaining) : "***")} trend="Category balances" accent="amber" />
            </section>

            <section className="dash-card admin-funds-card">
                <div className="dash-card-head">
                    <h2>Budget Category Balances</h2>
                    <img 
                        src={showBalances ? eyeCloseIcon : eyeOpenIcon} 
                        alt="Toggle All" 
                        style={{ cursor: 'pointer', width: '20px', height: '20px' }} 
                        onClick={() => setShowBalances(!showBalances)}
                    />
                </div>

                {loading && <p className="muted">Loading…</p>}
                {!loading && stats.categoryBalances.length === 0 && <p className="muted">No category data yet.</p>}

                {!loading && stats.categoryBalances.length > 0 && (
                    <div className="fund-grid">
                        {stats.categoryBalances.map((category) => {
                            const allocated = Number(category.allocated_amount || 0);
                            const spent = Number(category.spent_amount || 0);
                            const balance = Number(category.balance || 0);
                            const percentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
                            const status = getCategoryStatus(percentage);
                            const isCardHidden = !showBalances || hiddenCategories[category.id];

                            return (
                                <div key={category.id} className="fund-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px' }}>
                                        <div className="fund-card-title" style={{ margin: 0, padding: 0, border: 'none' }}>
                                            {category.name}
                                        </div>
                                        <img 
                                            src={isCardHidden ? eyeCloseIcon : eyeOpenIcon} 
                                            alt="Toggle" 
                                            style={{ cursor: 'pointer', width: '18px', height: '18px', opacity: 0.7 }} 
                                            onClick={() => toggleCategory(category.id)}
                                        />
                                    </div>

                                    <div className="fund-card-numbers">
                                        <div className="fund-number-row">
                                            <span className="fund-label">Balance</span>
                                            <span className="fund-value highlight">{isCardHidden ? "***" : formatPeso(balance)}</span>
                                        </div>
                                        <div className="fund-number-row">
                                            <span className="fund-label">Allocated</span>
                                            <span className="fund-value">{isCardHidden ? "***" : formatPeso(allocated)}</span>
                                        </div>
                                        <div className="fund-number-row">
                                            <span className="fund-label">Spent</span>
                                            <span className="fund-value">{isCardHidden ? "***" : formatPeso(spent)}</span>
                                        </div>
                                    </div>
                                    <div className="fund-card-footer">
                                        <div className="fund-progress-wrap">
                                            <div className="fund-progress-bar" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                        <div className="fund-footer-text">
                                            <span>{percentage.toFixed(1)}% utilized</span>
                                            <span className={`fund-status fund-status-${status.toLowerCase()}`}>{status}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <DashboardChart />

            <section className="dash-card" style={{ marginTop: '20px' }}>
                <div className="dash-card-head">
                    <h2>Quick Actions</h2>
                </div>
                <div className="quick-actions">
                    <QuickAction to="/admin/invite-codes"  Icon={IconTicket} label="Generate Invite Code" />
                    <QuickAction to="/Revenue"             Icon={IconUsers}  label="Monitor Revenue Records" />
                </div>
                <div className="dash-note">
                    <strong>Note:</strong> Your dashboard auto-refreshes every 5 minutes,
                    so numbers stay current as the treasurer adds records.
                </div>
            </section>
        </div>
    );
}

function formatPeso(value) {
    return "₱" + Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}