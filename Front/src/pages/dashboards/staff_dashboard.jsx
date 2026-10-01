import "../../styles/dashboard.css";
import "../../styles/staff_dashboard.css";
import {
    IconFile, IconClock, IconCheckCircle, IconThumbsUp, IconMoney, IconChart,
    StatCard, ActivityRow, QuickAction, DashboardHero,
} from "../../components/dashboard_widgets";
import { useStaffStats } from "../../custom_hooks/use_staff_stats";

export default function StaffDashboard({ user }) {
    const { stats, loading, error, refresh } = useStaffStats();

    const formatPeso = (n) =>
        "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

    return (
        <div className="dashboard-page staff-view">
            <DashboardHero user={user} />

            {error && <div className="alert alert-error">{error}</div>}

            {/* ===== STAT CARDS ===== */}
            <section className="stat-grid">
                <StatCard
                    Icon={IconFile}
                    label="My Entries"
                    value={loading ? "…" : stats.totalEntries}
                    trend="Total submitted"
                    accent="blue"
                />
                <StatCard
                    Icon={IconClock}
                    label="This Month"
                    value={loading ? "…" : stats.entriesThisMonth}
                    trend="Current month"
                    accent="amber"
                />
                <StatCard
                    Icon={IconMoney}
                    label="Amount Recorded"
                    value={loading ? "…" : formatPeso(stats.totalAmount)}
                    trend="Total value"
                    accent="green"
                />
                <StatCard
                    Icon={IconThumbsUp}
                    label="Status"
                    value="Active"
                    trend="Account in good standing"
                    accent="purple"
                />
            </section>

            {/* ===== TWO COLUMN ===== */}
            <section className="dash-columns">

                {/* My Recent Entries */}
                <div className="dash-card">
                    <div className="dash-card-head">
                        <h2>My Recent Entries</h2>
                        <button className="dash-link" onClick={refresh}>Refresh</button>
                    </div>

                    {loading && <p className="muted">Loading…</p>}

                    {!loading && stats.recentActivity.length === 0 && (
                        <p className="muted">You haven't recorded any revenue yet.</p>
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

                {/* Quick Actions */}
                <div className="dash-card">
                    <div className="dash-card-head">
                        <h2>Quick Actions</h2>
                    </div>
                    <div className="quick-actions">
                        <QuickAction to="/Revenue" Icon={IconMoney} label="Record Revenue" />
                        <QuickAction to="/Revenue" Icon={IconFile}  label="Submit Expenditure" />
                        <QuickAction to="/Revenue" Icon={IconChart} label="My Entries" />
                    </div>
                    <div className="dash-tip">
                        <strong>Tip:</strong> Submit entries on time so they can be reviewed
                        and approved by the treasurer.
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