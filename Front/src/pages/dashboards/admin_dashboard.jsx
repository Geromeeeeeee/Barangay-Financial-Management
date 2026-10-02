import "../../styles/dashboard.css";
import "../../styles/admin_dashboard.css";
import {
    IconUsers, IconClock, IconTicket, IconChart,
    IconCheckCircle, IconMoney,
    StatCard, ActivityRow, QuickAction, DashboardHero,
} from "../../components/dashboard_widgets";
import { useDashboardStats } from "../../custom_hooks/use_dashboard_stats";

export default function AdminDashboard({ user }) {
    const { stats, loading, error, refresh } = useDashboardStats();

    const getFundStatus = (percentage) => {
        if (percentage >= 75) return "Critical";
        if (percentage >= 50) return "Warning";
        if (percentage >= 20) return "Good";
        return "Excellent";
    };

    return (
        <div className="dashboard-page admin-view">
            <DashboardHero user={user} />

            {error && <div className="alert alert-error">{error}</div>}

            {/* ===== STAT CARDS (live) ===== */}
            <section className="stat-grid">
                <StatCard
                    Icon={IconUsers}
                    label="Total Users"
                    value={loading ? "…" : stats.totalUsers}
                    trend="Registered accounts"
                    accent="blue"
                />
                <StatCard
                    Icon={IconClock}
                    label="Pending Approvals"
                    value={loading ? "…" : stats.pendingApprovals}
                    trend={stats.pendingApprovals > 0 ? "Needs review" : "All clear"}
                    accent="amber"
                />
                <StatCard
                    Icon={IconTicket}
                    label="Active Invite Codes"
                    value={loading ? "…" : stats.activeCodes}
                    trend="Valid & unused"
                    accent="green"
                />
                <StatCard
                    Icon={IconChart}
                    label="Records This Month"
                    value={loading ? "…" : stats.recordsThisMonth}
                    trend="Revenue entries"
                    accent="purple"
                />
            </section>

            {/* ===== FUND BALANCES ===== */}
            <section className="dash-card admin-funds-card">
                <div className="dash-card-head">
                    <h2>Fund Balances</h2>
                </div>

                {loading && <p className="muted">Loading…</p>}

                {!loading && stats.fundBalances.length === 0 && (
                    <p className="muted">No fund data yet.</p>
                )}

                {!loading && stats.fundBalances.length > 0 && (
                    <div className="fund-grid">
                        {stats.fundBalances.map((fund) => {
                            const percentage = Number(fund.usage_percentage || 0);
                            const status = getFundStatus(percentage);

                            return (
                                <div key={fund.fund_name} className="fund-card">
                                    <div className="fund-card-header">
                                        <div className="fund-name">{fund.fund_name}</div>
                                        <span className={`fund-card-status fund-status-${status.toLowerCase()}`}>
                                            {status}
                                        </span>
                                    </div>
                                    <div className="fund-card-value">{formatPeso(fund.balance)}</div>
                                    <div className="fund-card-detail">
                                        Remaining balance · {formatPeso(fund.total_allocated)} total
                                    </div>
                                    <div className="fund-card-detail">
                                        {percentage.toFixed(2)}% utilized
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ===== TWO COLUMN ===== */}
            <section className="dash-columns">

                {/* Recent Activity (live) */}
                <div className="dash-card">
                    <div className="dash-card-head">
                        <h2>Recent Activity</h2>
                        <button className="dash-link" onClick={refresh}>Refresh</button>
                    </div>

                    {loading && <p className="muted">Loading…</p>}

                    {!loading && stats.recentActivity.length === 0 && stats.recentRequests.length === 0 && (
                        <p className="muted">No recent activity.</p>
                    )}

                    {!loading && (
                        <ul className="activity-list">
                            {/* Latest revenue entries */}
                            {stats.recentActivity.map((row) => (
                                <ActivityRow
                                    key={`rev-${row.id}`}
                                    dot="green"
                                    title={`Revenue: ${row.source}`}
                                    meta={`₱${Number(row.amount).toLocaleString()} · ${row.fund_allocation}`}
                                    time={timeAgo(row.created_at)}
                                />
                            ))}

                            {/* Pending account requests */}
                            {stats.recentRequests.map((u) => (
                                <ActivityRow
                                    key={`usr-${u.id}`}
                                    dot="blue"
                                    title="New account request"
                                    meta={`${u.username} · ${u.role}`}
                                    time={timeAgo(u.created_at)}
                                />
                            ))}
                        </ul>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="dash-card">
                    <div className="dash-card-head">
                        <h2>Quick Actions</h2>
                    </div>
                    <div className="quick-actions">
                        <QuickAction to="/admin/invite-codes"  Icon={IconTicket}      label="Generate Invite Code" />
                        <QuickAction to="/admin/pending-users" Icon={IconCheckCircle} label="Review Pending Users" />
                        <QuickAction to="/Revenue"             Icon={IconMoney}       label="View Revenue Records" />
                    </div>
                    <div className="dash-tip">
                        <strong>Tip:</strong> Your dashboard auto-refreshes every 30 seconds,
                        so numbers stay current as staff add records.
                    </div>
                </div>

            </section>
        </div>
    );
}

// ======================== HELPER ========================
function formatPeso(value) {
    return "₱" + Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
    });
}

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