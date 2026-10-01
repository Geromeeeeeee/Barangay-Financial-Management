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
                        <h2>Top Fund Allocations</h2>
                    </div>

                    {loading && <p className="muted">Loading…</p>}

                    {!loading && stats.topFunds.length === 0 && (
                        <p className="muted">No fund data yet.</p>
                    )}

                    {!loading && stats.topFunds.length > 0 && (
                        <ul className="fund-list">
                            {stats.topFunds.map((f) => (
                                <li key={f.fund_allocation} className="fund-row">
                                    <div className="fund-info">
                                        <div className="fund-name">{f.fund_allocation}</div>
                                        <div className="fund-meta">{f.entries} entries</div>
                                    </div>
                                    <div className="fund-amount">{formatPeso(f.total)}</div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="dash-tip" style={{ marginTop: 18 }}>
                        <strong>Tip:</strong> Keep records updated daily so fund balances
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