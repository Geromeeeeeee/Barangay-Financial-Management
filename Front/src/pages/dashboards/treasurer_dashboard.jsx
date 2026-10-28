import "../../styles/dashboard.css";
import "../../styles/treasurer_dashboard.css";
import DashboardChart from "../../components/dashboard_chart";
import eyeOpenIcon from "../../assets/eye_open.svg";
import eyeCloseIcon from "../../assets/eye_close.svg"
import {
    IconReceipt, IconBank,
    StatCard, ActivityRow, DashboardHero,
} from "../../components/dashboard_widgets";
import { useTreasurerStats } from "../../custom_hooks/use_treasurer_stats";

export default function TreasurerDashboard({ user }) {
    const { stats, loading, error, refresh, isVisible, setIsVisible } = useTreasurerStats();

    const getCategoryStatus = (percentage) => {
        if (percentage >= 75) return "Critical";
        if (percentage >= 50) return "Warning";
        if (percentage >= 20) return "Good";
        return "Excellent";
    };

    const formatPeso = (n) =>
        "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });


    return (
        <div className="dashboard-page treasurer-view">
            <DashboardHero user={user} />

            {error && <div className="alert alert-error">{error}</div>}
            <section className="stat-grid">
                <StatCard
                    Icon="₱"
                    label="Total Revenue"
                    value={loading ? "…" : formatPeso(stats.totalRevenue)}
                    trend="All time collection"
                    accent="green"
                />
                <StatCard
                    Icon="₱"
                    label="This Month"
                    value={loading ? "…" : formatPeso(stats.revenueThisMonth)}
                    trend="Current month"
                    accent="blue"
                />
                <StatCard
                    Icon={IconReceipt}
                    label="Total Records"
                    value={loading ? "…" : stats.totalRecords}
                    trend="All entries"
                    accent="purple"
                />
                <StatCard
                    Icon={IconBank}
                    label="This Month's Records"
                    value={loading ? "…" : stats.recordsThisMonth}
                    trend="New entries"
                    accent="amber"
                />
            </section>
            <section className="dash-card admin-funds-card">
                <div className="dash-card-head">
                    <h2>Budget Category Balances</h2>
                    <img src={isVisible ? eyeCloseIcon : eyeOpenIcon} alt="" className="visibility" onClick={()=>setIsVisible(!isVisible)}/>
                </div>

                {loading && <p className="muted">Loading…</p>}
                {!loading && stats.categoryBalances.length === 0 && (
                    <p className="muted">No category data yet.</p>
                )}

                {!loading && stats.categoryBalances.length > 0 && (
                    <div className="fund-grid">
                        {stats.categoryBalances.map((category) => {
                            const allocated = Number(category.allocated_amount || 0);
                            const spent = Number(category.spent_amount || 0);
                            const balance = Number(category.balance || 0);
                            const percentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
                            const status = getCategoryStatus(percentage);

                            return (
                                <div key={category.id} className="fund-card">
                                    <div className="fund-card-title">
                                        {category.name}
                                    </div>

                                    <div className="fund-card-numbers">
                                        <div className="fund-number-row">
                                            <span className="fund-label">Balance</span>
                                            {isVisible ? (<span className="fund-value highlight">{formatPeso(balance)}</span>) : '***'}
                                            
                                        </div>
                                        <div className="fund-number-row">
                                            <span className="fund-label">Allocated</span>
                                             {isVisible ? (<span className="fund-value highlight">{formatPeso(allocated)}</span>) : '***'}
                                        </div>
                                        <div className="fund-number-row">
                                            <span className="fund-label">Spent</span>
                                             {isVisible ? (<span className="fund-value highlight">{formatPeso(spent)}</span>) : '***'}
                                        </div>
                                    </div>

                                    <div className="fund-card-footer">
                                        <div className="fund-progress-wrap">
                                            <div className="fund-progress-bar" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                        <div className="fund-footer-text">
                                            <span>{percentage.toFixed(1)}% utilized</span>
                                            <span className={`fund-status fund-status-${status.toLowerCase()}`}>
                                                {status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <DashboardChart />
            <section className="dash-columns">

                {/* Recent Records */}
                <div className="dash-card">
                    <div className="dash-card-head">
                        <h2>Recent Revenue Activity</h2>
                        <button className="dash-link" onClick={refresh}>Refresh</button>
                    </div>

                    {loading && <p className="muted">Loading…</p>}
                    {!loading && stats.recentActivity.length === 0 && (
                        <p className="muted">No revenue records yet.</p>
                    )}

                    {!loading && stats.recentActivity.length > 0 && (
                        <ul className="activity-list">
                            {stats.recentActivity.map((row) => (
                                <ActivityRow
                                    key={row.id}
                                    dot="green"
                                    title={row.source}
                                    meta={`${formatPeso(row.amount)} · ${row.fund_allocation}`}
                                    time={timeAgo(row.created_at)}
                                />
                            ))}
                        </ul>
                    )}
                </div>

                {/* Notes / Actions */}
                <div className="dash-card">
                    <div className="dash-card-head">
                        <h2>Quick Note</h2>
                    </div>
                    <div className="dash-note">
                        <strong>Note:</strong> records updated daily so fund balances
                        stay accurate for the Barangay Captain's review.
                    </div>
                </div>

            </section>
        </div>
    );
}

// ======================== HELPER ========================
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