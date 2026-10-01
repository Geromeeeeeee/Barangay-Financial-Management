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