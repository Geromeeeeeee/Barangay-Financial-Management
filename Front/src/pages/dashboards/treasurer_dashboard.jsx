import "../../styles/dashboard.css";
import "../../styles/treasurer_dashboard.css";
import {
    IconMoney, IconTrendDown, IconBank, IconReceipt, IconChart, IconPeso,
    StatCard, ActivityRow, QuickAction, DashboardHero,
} from "../../components/dashboard_widgets";
import { useTreasurerStats } from "../../custom_hooks/use_treasurer_stats";

export default function TreasurerDashboard({ user }) {
    const { stats, loading, error, refresh } = useTreasurerStats();

    const formatPeso = (n) =>
        "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

    const getFundStatus = (percentage) => {
        if (percentage >= 75) return "Critical";
        if (percentage >= 50) return "Warning";
        if (percentage >= 20) return "Good";
        return "Excellent";
    };

    return (
        <div className="dashboard-page treasurer-view">
            <DashboardHero user={user} />

            {error && <div className="alert alert-error">{error}</div>}

            {/* ===== STAT CARDS ===== */}
            <section className="stat-grid">
              <StatCard
               Icon={IconPeso}
               label="Total Revenue"
               value={loading ? "…" : formatPeso(stats.totalRevenue)}
               trend="All time"
            accent="green"
           />
                <StatCard
               Icon={IconPeso}
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
                    label="Records This Month"
                    value={loading ? "…" : stats.recordsThisMonth}
                    trend="New this month"
                    accent="amber"
                />
            </section>

            {/* ===== TWO COLUMN ===== */}
            <section className="dash-columns">

                {/* Recent Records */}
                <div className="dash-card">
                    <div className="dash-card-head">
                        <h2>Recent Records</h2>
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

                {/* Top Fund Allocations */}
                <div className="dash-card">
                    <div className="dash-card-head">
                        <h2>Fund Balances</h2>
                    </div>

                    {loading && <p className="muted">Loading…</p>}

                    {!loading && stats.fundBalances.length === 0 && (
                        <p className="muted">No fund data yet.</p>
                    )}

                    {!loading && stats.fundBalances.length > 0 && (
                        <div className="fund-grid">
                            {stats.fundBalances.map((f) => {
                                const percentage = Number(f.usage_percentage || 0);
                                const status = getFundStatus(percentage);

                                return (
                                    <div key={f.fund_name} className="fund-card">
                                        <div className="fund-card-header">
                                            <div className="fund-name">{f.fund_name}</div>
                                            <span className={`fund-card-status fund-status-${status.toLowerCase()}`}>
                                                {status}
                                            </span>
                                        </div>
                                        <div className="fund-card-value">{formatPeso(f.balance)}</div>
                                        <div className="fund-card-detail">
                                            Remaining balance · {formatPeso(f.total_allocated)} total
                                        </div>
                                        <div className="fund-card-detail">
                                            {percentage.toFixed(2)}% utilized
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="dash-tip" style={{ marginTop: 18 }}>
                        <strong>Tip:</strong> Fund status is based on utilization:
                        75% or more is Critical, 50% to less than 75% is Warning,
                        20% to less than 50% is Good, and below 20% is Excellent.
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