import { useState } from "react";
import "../../styles/dashboard.css";
import {
    StatCard, DashboardHero,
} from "../../components/dashboard_widgets";
import { useStaffStats } from "../../custom_hooks/use_staff_stats.jsx";
import RecentActivity from "../../components/recent_activity";

export default function StaffDashboard({ user }) {
    const { stats, loading, error, refresh } = useStaffStats();
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
                <StatCard Icon="₱" label="Total Revenue" value={loading ? "…" : formatPeso(stats.totalAmount)} trend="Annual budget entries" accent="green" />
                <StatCard Icon="₱" label="This Month" value={loading ? "…" : stats.entriesThisMonth} trend="Revenue entries" accent="blue" />
                <StatCard Icon="₱" label="Total Records" value={loading ? "…" : stats.totalEntries} trend="All revenue entries" accent="purple" />
            </section>
        </div>
    );
}