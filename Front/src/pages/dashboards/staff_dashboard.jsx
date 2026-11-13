import { useState } from "react";
import "../../styles/dashboard.css";
import {
    StatCard, DashboardHero,
    IconBank,
    IconReceipt,
} from "../../components/dashboard_widgets";
import RecentActivity from "../../components/recent_activity";
import { useTreasurerStats } from "../../custom_hooks/use_treasurer_stats.jsx";

export default function StaffDashboard({ user }) {
    const { stats, loading, error, refresh } = useTreasurerStats();
    const [activityType, setActivityType] = useState("revenue");
    const selectedActivity = activityType === "revenue"
        ? stats.recentActivity
        : stats.recentExpenditures;
    const formatPeso = (value) =>
        "₱" + Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

    return (
        <div className="dashboard-page">
            <div className="top-split-layout">
                <div className="hero-wrapper">
                    <DashboardHero user={user} />
                </div>
                <RecentActivity
                    activityType={activityType}
                    refresh={refresh}
                    loading={loading}
                    selectedActivity={selectedActivity}
                    setActivityType={setActivityType}
                />
            </div>

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
        </div>
    );
}