import "../../styles/dashboard.css";
import "../../styles/treasurer_dashboard.css";
import {
    IconMoney, IconChart,
    StatCard, ActivityRow, DashboardHero,
} from "../../components/dashboard_widgets";
import { useTreasurerStats } from "../../custom_hooks/use_treasurer_stats";

export default function TreasurerDashboard({ user }) {
    const { stats, loading, error, refresh } = useTreasurerStats();

    const formatPeso = (n) =>
        "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

    const getCategoryStatus = (percentage) => {
        if (percentage >= 75) return "Critical";
        if (percentage >= 50) return "Warning";
        if (percentage >= 20) return "Good";
        return "Excellent";
    };

    const uniqueCategories = Array.from(
        new Map(
            (stats.categoryBalances || []).map((category) => [
                category.name.trim().toLowerCase(),
                category,
            ])
        ).values()
    );

    return (
        <div className="dashboard-page treasurer-view">
            <DashboardHero user={user} />

            {error && <div className="alert alert-error">{error}</div>}

            <section className="stat-grid budget-summary">
                <StatCard
                    Icon={IconMoney}
                    label="NTA"
                    value={loading ? "…" : formatPeso(stats.nta)}
                    trend="Annual income"
                    accent="blue"
                />
                <StatCard
                    Icon={IconMoney}
                    label="Local Income"
                    value={loading ? "…" : formatPeso(stats.localIncome)}
                    trend="Annual income"
                    accent="green"
                />
                <StatCard
                    Icon={IconMoney}
                    label="Total Annual Income"
                    value={loading ? "…" : formatPeso(stats.totalAnnualIncome)}
                    trend="NTA + Local Income"
                    accent="purple"
                />
                <StatCard
                    Icon={IconChart}
                    label="Total Allocated"
                    value={loading ? "…" : formatPeso(stats.totalAllocated)}
                    trend="All major categories"
                    accent="amber"
                />
                <StatCard
                    Icon={IconChart}
                    label="Total Expenditures"
                    value={loading ? "…" : formatPeso(stats.totalExpenditures)}
                    trend="Recorded spending"
                    accent="red"
                />
                <StatCard
                    Icon={IconMoney}
                    label="Total Remaining"
                    value={loading ? "…" : formatPeso(stats.totalRemaining)}
                    trend="Category balances"
                    accent="green"
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

                {/* Budget Category Balances */}
                <div className="dash-card">
                    <div className="dash-card-head">
                        <h2>Budget Category Balances</h2>
                    </div>

                    {loading && <p className="muted">Loading…</p>}

                    {!loading && uniqueCategories.length === 0 && (
                        <p className="muted">No category data yet.</p>
                    )}

                    {!loading && uniqueCategories.length > 0 && (
                        <div className="fund-grid">
                            {uniqueCategories.map((category) => {
                                const allocated = Number(category.allocated_amount || 0);
                                const spent = Number(category.spent_amount || 0);
                                const percentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
                                const status = getCategoryStatus(percentage);

                                return (
                                    <div key={category.id} className="fund-card">
                                        <div className="fund-card-header">
                                            <div className="fund-name">{category.name}</div>
                                            <span className={`fund-card-status fund-status-${status.toLowerCase()}`}>
                                                {status}
                                            </span>
                                        </div>
                                        <div className="fund-card-value">{formatPeso(category.balance)}</div>
                                        <div className="fund-card-detail">
                                            Remaining balance · {formatPeso(allocated)} allocated
                                        </div>
                                        <div className="fund-card-detail">
                                            {formatPeso(spent)} spent · {percentage.toFixed(2)}% utilized
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="dash-tip" style={{ marginTop: 18 }}>
                        <strong>Tip:</strong> Category status is based on utilization:
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