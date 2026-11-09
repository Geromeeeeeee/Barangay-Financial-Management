import { useState } from "react";
import "../../styles/dashboard.css";
import "../../styles/treasurer_dashboard.css";
import DashboardChart from "../../components/dashboard_chart";
import {
    IconReceipt, IconBank,
    StatCard, DashboardHero,
} from "../../components/dashboard_widgets";
import { useTreasurerStats } from "../../custom_hooks/use_treasurer_stats";
import RecentActivity from "../../components/recent_activity";
import BudgetBalances from "../../components/budget_balances";
import AnnualBudgetReleaseSection from "../../components/annual_budget_release_section";

export default function TreasurerDashboard({ user }) {
    const { stats, loading, error, refresh } = useTreasurerStats();
    const [activityType, setActivityType] = useState("revenue");
    const [hiddenCategories, setHiddenCategories] = useState({});

    const toggleCategory = (id) => {
        setHiddenCategories(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleAll = () => {
        // Check if all categories are currently hidden
        const allHidden = stats.categoryBalances.length > 0 && 
                          stats.categoryBalances.every(c => hiddenCategories[c.id]);

        if (allHidden) {
            setHiddenCategories({}); // Show all
        } else {
            const allHiddenState = {};
            stats.categoryBalances.forEach(c => allHiddenState[c.id] = true);
            setHiddenCategories(allHiddenState); // Hide all
        }
    };
    
    const selectedActivity = activityType === "revenue"
        ? stats.recentActivity
        : stats.recentExpenditures;

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
            {error && <div className="alert alert-error">{error}</div>}

            <div className="top-split-layout">
                <div className="hero-wrapper">
                    <DashboardHero user={user} />
                </div>

                <RecentActivity activityType={activityType} refresh={refresh} loading={loading} selectedActivity={selectedActivity} setActivityType={setActivityType}/>
            </div>

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

            <BudgetBalances 
                loading={loading} 
                stats={stats} 
                getCategoryStatus={getCategoryStatus} 
                hiddenCategories={hiddenCategories} 
                toggleCategory={toggleCategory} 
                toggleAll={toggleAll}
                formatPeso={formatPeso} 
            />

            <AnnualBudgetReleaseSection stats={stats} loading={loading} formatPeso={formatPeso} isVisible={true} />

            <DashboardChart />
        </div>
    );
}