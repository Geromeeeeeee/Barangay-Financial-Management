import { useState } from "react";
import "../../styles/dashboard.css";
import "../../styles/admin_dashboard.css";
import DashboardChart from "../../components/dashboard_chart";
import {
    IconUsers, IconTicket,
    StatCard, QuickAction, DashboardHero,
} from "../../components/dashboard_widgets";
import { useDashboardStats } from "../../custom_hooks/use_dashboard_stats";
import RecentActivity from "../../components/recent_activity";
import BudgetBalances from "../../components/budget_balances";

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

            <BudgetBalances isVisible={showBalances} setIsVisible={setShowBalances} loading={loading} stats={stats} getCategoryStatus={getCategoryStatus} hiddenCategories={hiddenCategories} toggleCategory={toggleCategory} formatPeso={formatPeso}/>

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